import Promise from 'bluebird';
import objectUtils from '../../utils/object-utils';
import * as AuthHandler from '../../authorization/auth-handler';
import * as StatusErrors from '../../errors/status-errors';
import * as ActionUtils from '../action-utils';
import ACTION from '../action-constants';

const debug = false;

export default function upsertItem(bookshelf, spec = {}, input = {}) {
  const trx = input[ACTION.INPUT_TRANSACTING];

  // Continue on existing transaction...
  if (trx) return performUpsertItem(bookshelf, spec, input);

  // Otherwise, start new transaction...
  return bookshelf.transaction((newTrx) => {
    const newInput = Object.assign({}, input);
    newInput[ACTION.INPUT_TRANSACTING] = newTrx;
    return performUpsertItem(bookshelf, spec, newInput);
  });
}

function performUpsertItem(bookshelf, spec = {}, input = {}) {
  return new Promise((resolve, reject) => {
    const modelName = spec[ACTION.SPEC_MODEL_NAME];
    const specFields = spec[ACTION.SPEC_FIELDS];
    const specAuth = spec[ACTION.SPEC_AUTH] || {};
    const inputFields = ActionUtils.prepareFieldData(specFields, input[ACTION.INPUT_FIELDS]);
    const trx = input[ACTION.INPUT_TRANSACTING];
    const authBundle = input[ACTION.INPUT_AUTH_BUNDLE];

    // Reject if model does not exist...
    const model = bookshelf.model(modelName);
    if (!model) {
      if (debug) console.log(`[JOINT] [action:upsertItem] The model "${modelName}" is not recognized`);
      return reject(StatusErrors.generateModelNotRecognizedError(modelName));
    }

    // Reject when required fields are not provided...
    const requiredFieldCheck = ActionUtils.checkRequiredFields(specFields, inputFields);
    if (!requiredFieldCheck.satisfied) {
      if (debug) console.log('[JOINT] [action:upsertItem] Action has missing required fields:', requiredFieldCheck.missing);
      return reject(StatusErrors.generateMissingFieldsError(requiredFieldCheck.missing));
    }

    // Determine lookup field to fetch item...
    const lookupFieldData = ActionUtils.getLookupFieldData(specFields, inputFields);
    if (!lookupFieldData) {
      // Reject when a lookup field cannot be determined...
      if (debug) console.log('[JOINT] [action:upsertItem] Action did not define or provide a "lookup field"');
      return reject(StatusErrors.generateLookupFieldNotProvidedError());
    }

    // Prepare upsert action options...
    const actionOpts = { require: true };
    if (trx) actionOpts.transacting = trx;

    // Build upsert package...
    const upsertData = {};
    if (inputFields && specFields) {
      specFields.forEach((fieldSpec) => {
        const fieldName = fieldSpec.name;
        const isLookupField = objectUtils.get(fieldSpec, 'lookupField', false);
        const hasDefault = objectUtils.has(fieldSpec, 'defaultValue');
        const hasInput = objectUtils.has(inputFields, fieldName);

        if ((hasInput || hasDefault) && !isLookupField) {
          const fieldValue = (hasInput)
              ? inputFields[fieldName]
              : fieldSpec.defaultValue;

          upsertData[fieldName] = fieldValue;
        }
      }); // end-specFields.forEach
    } // end-if (inputFields && specFields)

    // Look for item...
    return model.where(lookupFieldData).fetch(actionOpts)
      .then((resource) => {
        // Respect auth...
        if (authBundle) {
          const combinedFields = Object.assign({}, resource.attributes, inputFields);
          const ownerCreds = ActionUtils.parseOwnerCreds(specAuth, combinedFields);
          if (!AuthHandler.isAllowed(authBundle, ownerCreds)) {
            return reject(StatusErrors.generateNotAuthorizedError());
          }
        } // end-if (authBundle)

        // Debug executing logic...
        if (debug) console.log(`[JOINT] [action:upsertItem] EXECUTING => UPDATE ${modelName} WITH`, upsertData);

        // ------------------------
        // Perform update action...
        // ------------------------
        return resource.save(upsertData, actionOpts)
          .then((data) => {
            return resolve(data);
          })
          .catch((error) => {
            if (debug) console.log('[JOINT] [action:upsertItem] Action encountered an error on update =>', error);
            return reject(StatusErrors.generateThirdPartyError(error));
          });
      })
      .catch((error) => {
        if (error.message && error.message === 'EmptyResponse') {
          // Respect auth...
          if (authBundle) {
            const ownerCreds = ActionUtils.parseOwnerCreds(specAuth, inputFields);
            if (!AuthHandler.isAllowed(authBundle, ownerCreds)) {
              return reject(StatusErrors.generateNotAuthorizedError());
            }
          } // end-if (authBundle)

          // Debug executing logic...
          if (debug) console.log(`[JOINT] [action:upsertItem] EXECUTING => CREATE ${modelName} WITH`, upsertData);

          // ------------------------
          // Perform create action...
          // ------------------------
          return model.forge(lookupFieldData).save(upsertData, actionOpts)
            .then((data) => {
              return resolve(data);
            })
            .catch((createError) => {
              if (debug) console.log('[JOINT] [action:upsertItem] Action encountered an error on create =>', createError);
              return reject(StatusErrors.generateThirdPartyError(createError));
            });
        }

        if (debug) console.log('[JOINT] [action:upsertItem] Action encountered an error =>', error);
        return reject(StatusErrors.generateThirdPartyError(error));
      });
  });
} // END - performUpsertItem