import Promise from 'bluebird';
import * as StatusErrors from '../../errors/status-errors';
import ACTION from '../action-constants';
import getItem from './getItem';

const debug = false;

export default function addAssociatedItem(bookshelf, spec = {}, input = {}) {
  const trx = input[ACTION.INPUT_TRANSACTING];

  // Continue on existing transaction...
  if (trx) return performAddAssociatedItem(bookshelf, spec, input);

  // Otherwise, start new transaction...
  return bookshelf.transaction((newTrx) => {
    const newInput = Object.assign({}, input);
    newInput[ACTION.INPUT_TRANSACTING] = newTrx;
    return performAddAssociatedItem(bookshelf, spec, newInput);
  });
}

function performAddAssociatedItem(bookshelf, spec = {}, input = {}) {
  return new Promise((resolve, reject) => {
    const specMain = spec[ACTION.RESOURCE_MAIN];
    const specAssoc = spec[ACTION.RESOURCE_ASSOCIATION];
    const assocName = spec[ACTION.ASSOCIATION_NAME];
    const inputMain = input[ACTION.RESOURCE_MAIN];
    const inputAssoc = input[ACTION.RESOURCE_ASSOCIATION];
    const trx = input[ACTION.INPUT_TRANSACTING];

    // Reject when required properties are not provided...
    const missingProps = [];
    if (!specMain) missingProps.push(`spec.${ACTION.RESOURCE_MAIN}`);
    if (!specAssoc) missingProps.push(`spec.${ACTION.RESOURCE_ASSOCIATION}`);
    if (!inputMain) missingProps.push(`input.${ACTION.RESOURCE_MAIN}`);
    if (!inputAssoc) missingProps.push(`input.${ACTION.RESOURCE_ASSOCIATION}`);
    if (!assocName) missingProps.push(`spec.${ACTION.ASSOCIATION_NAME}`);
    if (missingProps.length > 0) {
      if (debug) console.log(`[JOINT] [action:addAssociatedItem] Required properties missing: "${missingProps.join('", "')}"`);
      return reject(StatusErrors.generateInvalidAssociationPropertiesError(missingProps));
    }

    // Load trx to both resources...
    inputMain[ACTION.INPUT_TRANSACTING] = trx;
    inputAssoc[ACTION.INPUT_TRANSACTING] = trx;

    // Include existing associations of this type (for return)...
    inputMain[ACTION.INPUT_RELATIONS] = [assocName];

    // Lookup resources...
    return Promise.all([
      getItem(bookshelf, specMain, inputMain),
      getItem(bookshelf, specAssoc, inputAssoc),
    ])
    // Add association to main...
    .then(([main, assoc]) => {
      return main.related(assocName).attach(assoc, { transacting: trx })
        .then(() => {
          return resolve(main);
        });
    })
    .catch((error) => {
      return reject(error);
    });
  });
} // END - performAddAssociatedItem