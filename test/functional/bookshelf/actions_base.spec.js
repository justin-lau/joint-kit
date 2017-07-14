import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as AuthHandler from '../../../src/authorization/auth-handler';
import Joint from '../../../src';
import modelConfig from '../../configs/models/model-config';
import bookshelf from '../../db/bookshelf/bookshelf';
import { resetDB } from '../../db/bookshelf/db-utils';
import chaiHelpers from '../chai-helpers';

chai.use(chaiAsPromised);
chai.use(chaiHelpers);
const expect = chai.expect;

let joint = null;

// ------------------------
// BOOKSHELF ACTIONS (base)
// ------------------------
describe('BASE ACTIONS [bookshelf]', () => {
  before(() => {
    joint = new Joint({
      serviceKey: 'bookshelf',
      service: bookshelf,
    });
    joint.generate({ modelConfig, log: false });
  });

  // ---------------------------------
  // Testing: standard error scenarios
  // ---------------------------------
  describe('standard error scenarios (createItem, upsertItem, updateItem, getItem, getItems, deleteItem)', () => {
    before(() => resetDB(['users', 'projects']));

    it('should return an error (400) when the specified model does not exist', () => {
      const spec = {
        modelName: 'Alien',
        fields: [
          { name: 'id', type: 'Number', requiredOr: true },
          { name: 'slug', type: 'Number', requiredOr: true },
        ],
      };
      const input = {
        fields: {
          id: 1,
        },
      };

      // createItem
      const createItemAction = expect(joint.createItem(spec, input))
        .to.eventually.be.rejectedWithJointStatusError(400);

      // upsertItem
      const upsertItemAction = expect(joint.upsertItem(spec, input))
        .to.eventually.be.rejectedWithJointStatusError(400);

      // updateItem
      const updateItemAction = expect(joint.updateItem(spec, input))
        .to.eventually.be.rejectedWithJointStatusError(400);

      // getItem
      const getItemAction = expect(joint.getItem(spec, input))
        .to.eventually.be.rejectedWithJointStatusError(400);

      // getItems
      const getItemsAction = expect(joint.getItems(spec, input))
        .to.eventually.be.rejectedWithJointStatusError(400);

      // deleteItem
      const deleteItemAction = expect(joint.deleteItem(spec, input))
        .to.eventually.be.rejectedWithJointStatusError(400);

      return Promise.all([
        createItemAction,
        upsertItemAction,
        updateItemAction,
        getItemAction,
        getItemsAction,
        deleteItemAction,
      ]);
    });

    it('should return an error (400) when a required field is not provided', () => {
      const spec01 = {
        modelName: 'User',
        fields: [
          { name: 'id', type: 'Number', requiredOr: true },
          { name: 'external_id', type: 'String', requiredOr: true },
        ],
      };
      const input01 = {
        fields: {
          identifier: 1,
        },
      };

      const spec02 = {
        modelName: 'User',
        fields: [
          { name: 'external_id', type: 'String', required: true },
          { name: 'display_name', type: 'String', requiredOr: false },
          { name: 'email', type: 'String', required: false },
          { name: 'avatar_url', type: 'String', defaultValue: '//extradimensional.org/avatars/human/random' },
          { name: 'is_intelligent', type: 'Boolean', defaultValue: false },
        ],
      };
      const input02 = {
        fields: {
          display_name: 'Jimbo',
          email: 'jimbo@mail.com',
        },
      };

      // createItem
      const createItem01 = expect(joint.createItem(spec01, input01))
        .to.eventually.be.rejectedWithJointStatusError(400);
      const createItem02 = expect(joint.createItem(spec02, input02))
        .to.eventually.be.rejectedWithJointStatusError(400);

      // upsertItem
      const upsertItem01 = expect(joint.upsertItem(spec01, input01))
        .to.eventually.be.rejectedWithJointStatusError(400);
      const upsertItem02 = expect(joint.upsertItem(spec02, input02))
        .to.eventually.be.rejectedWithJointStatusError(400);

      // updateItem
      const updateItem01 = expect(joint.updateItem(spec01, input01))
        .to.eventually.be.rejectedWithJointStatusError(400);
      const updateItem02 = expect(joint.updateItem(spec02, input02))
        .to.eventually.be.rejectedWithJointStatusError(400);

      // getItem
      const getItem01 = expect(joint.getItem(spec01, input01))
        .to.eventually.be.rejectedWithJointStatusError(400);
      const getItem02 = expect(joint.getItem(spec02, input02))
        .to.eventually.be.rejectedWithJointStatusError(400);

      // getItems
      const getItems01 = expect(joint.getItems(spec01, input01))
        .to.eventually.be.rejectedWithJointStatusError(400);
      const getItems02 = expect(joint.getItems(spec02, input02))
        .to.eventually.be.rejectedWithJointStatusError(400);

      // deleteItem
      const deleteItem01 = expect(joint.deleteItem(spec01, input01))
        .to.eventually.be.rejectedWithJointStatusError(400);
      const deleteItem02 = expect(joint.deleteItem(spec02, input02))
        .to.eventually.be.rejectedWithJointStatusError(400);

      return Promise.all([
        createItem01,
        createItem02,
        upsertItem01,
        upsertItem02,
        updateItem01,
        updateItem02,
        getItem01,
        getItem02,
        getItems01,
        getItems02,
        deleteItem01,
        deleteItem02,
      ]);
    });

    it('should return an error (403) when the authorization spec is not satisfied', () => {
      const spec = {
        modelName: 'Project',
        fields: [
          { name: 'profile_id', type: 'Number' },
          { name: 'user_id', type: 'Number' },
        ],
        auth: {
          ownerCreds: ['user_id', 'profile_id'],
        },
      };
      const input = {
        fields: {
          title: 'How to Blow Up Every Morning',
        },
        authBundle: {},
      };

      // With lookup field (for update/upsert)...
      const specForUpdate = {
        modelName: 'Project',
        fields: [
          { name: 'id', type: 'Number', required: true, lookupField: true },
        ],
        auth: {
          ownerCreds: ['user_id', 'profile_id'],
        },
      };
      const inputForUpdate = {
        fields: {
          id: 1,
        },
        authBundle: {},
      };

      // createItem
      const createItemAction = expect(joint.createItem(spec, input))
        .to.eventually.be.rejectedWithJointStatusError(403);

      // upsertItem
      const upsertItemAction = expect(joint.upsertItem(specForUpdate, inputForUpdate))
        .to.eventually.be.rejectedWithJointStatusError(403);

      // updateItem
      const updateItemAction = expect(joint.updateItem(specForUpdate, inputForUpdate))
        .to.eventually.be.rejectedWithJointStatusError(403);

      // getItem
      const getItemAction = expect(joint.getItem(spec, input))
        .to.eventually.be.rejectedWithJointStatusError(403);

      // getItems
      const getItemsAction = expect(joint.getItems(spec, input))
        .to.eventually.be.rejectedWithJointStatusError(403);

      // deleteItem
      const deleteItemAction = expect(joint.deleteItem(spec, input))
        .to.eventually.be.rejectedWithJointStatusError(403);

      return Promise.all([
        createItemAction,
        upsertItemAction,
        updateItemAction,
        getItemAction,
        getItemsAction,
        deleteItemAction,
      ]);
    });

    it('should report on missing required fields in a semantic way', () => {
      const spec = {
        modelName: 'Profile',
        fields: [
          { name: 'user_id', type: 'Number', required: true },
          { name: 'status_id', type: 'Number', required: true },
          { name: 'this_thing', type: 'String', requiredOr: true },
          { name: 'that_thing', type: 'String', requiredOr: true },
        ],
      };
      const missingOneRequired = {
        fields: {
          status_id: 0,
          this_thing: 'reality',
        },
      };
      const missingTwoRequired = {
        fields: {
          this_thing: 'reality',
          that_thing: 'fiction',
        },
      };
      const missingRequiredOrs = {
        fields: {
          user_id: 333,
          status_id: 0,
        },
      };
      const missingOneRequiredAndRequiredOrs = {
        fields: {
          status_id: 0,
        },
      };
      const missingTwoRequiredAndRequiredOrs = {
        fields: {},
      };

      const testCase01 = joint.createItem(spec, missingOneRequired)
        .catch((error) => {
          expect(error.message)
            .to.equal('Missing required field: "user_id"');
        });

      const testCase02 = joint.createItem(spec, missingTwoRequired)
        .catch((error) => {
          expect(error.message)
            .to.equal('Missing required fields: all of => ("user_id", "status_id")');
        });

      const testCase03 = joint.createItem(spec, missingRequiredOrs)
        .catch((error) => {
          expect(error.message)
            .to.equal('Missing required fields: at least one of => ("this_thing", "that_thing")');
        });

      const testCase04 = joint.createItem(spec, missingOneRequiredAndRequiredOrs)
        .catch((error) => {
          expect(error.message)
            .to.equal('Missing required fields: "user_id" AND at least one of => ("this_thing", "that_thing")');
        });

      const testCase05 = joint.createItem(spec, missingTwoRequiredAndRequiredOrs)
        .catch((error) => {
          expect(error.message)
            .to.equal('Missing required fields: all of => ("user_id", "status_id") AND at least one of => ("this_thing", "that_thing")');
        });

      return Promise.all([testCase01, testCase02, testCase03, testCase04, testCase05]);
    });
  }); // END - standard error scenarios

  // -------------------
  // Testing: createItem
  // -------------------
  describe('createItem', () => {
    before(() => resetDB());

    it('should create a new row for the specified model when the spec is satisfied', () => {
      // -------------------------
      // model: User, table: users
      // -------------------------
      const specUser = {
        modelName: 'User',
        fields: [
          { name: 'username', type: 'String', required: true },
          { name: 'display_name', type: 'String' },
        ],
      };
      const inputUser = {
        fields: {
          username: 'Blasta!',
        },
      };

      // -------------------------------
      // model: Profile, table: profiles
      // -------------------------------
      const specProfile = {
        modelName: 'Profile',
        fields: [
          { name: 'user_id', type: 'Number', required: true },
          { name: 'title', type: 'String', required: true },
          { name: 'is_live', type: 'Boolean', defaultValue: false },
        ],
      };
      const inputProfile = {
        fields: {
          user_id: 1,
          title: 'Days of Bore',
        },
      };

      const createUser = joint.createItem(specUser, inputUser)
        .then((rowData) => {
          expect(rowData)
            .to.have.property('attributes')
            .that.contains({
              id: 1,
              username: inputUser.fields.username,
            });
        });

      const createProfile = joint.createItem(specProfile, inputProfile)
        .then((rowData) => {
          expect(rowData)
            .to.have.property('attributes')
            .that.contains({
              id: 1,
              user_id: inputProfile.fields.user_id,
              title: inputProfile.fields.title,
              is_live: false,
            });
        });

      return Promise.all([createUser, createProfile]);
    });
  }); // END - createItem

  // -------------------
  // Testing: upsertItem
  // -------------------
  describe('upsertItem', () => {
    before(() => resetDB());

    it('should return an error (400) when the input does not provide a "lookupField"', () => {
      const spec = {
        modelName: 'AppSettings',
        fields: [
          { name: 'app_id', type: 'String', lookupField: true },
          { name: 'data', type: 'JSON', required: true },
        ],
      };

      const settingsData = { a: true, b: false, c: 'string-value' };

      const input = {
        fields: { data: settingsData },
      };

      return expect(joint.upsertItem(spec, input))
        .to.eventually.be.rejectedWithJointStatusError(400);
    });

    it('should perform a create action when the resource does not exist', () => {
      const spec = {
        modelName: 'AppSettings',
        fields: [
          { name: 'app_id', type: 'String', required: true, lookupField: true },
          { name: 'data', type: 'JSON', required: true },
        ],
      };

      const appID = 'app-12345';
      const settingsData = { a: true, b: false, c: 'string-value' };

      const input = {
        fields: { app_id: appID, data: settingsData },
      };

      return joint.upsertItem(spec, input)
        .then((data) => {
          expect(data.attributes.id).to.equal(1);
          expect(data.attributes.app_id).to.equal(appID);

          const dataJSON = JSON.parse(data.attributes.data);
          expect(dataJSON.c).to.equal('string-value');
        });
    });

    it('should perform an update action when the resource already exists', () => {
      const spec = {
        modelName: 'AppSettings',
        fields: [
          { name: 'app_id', type: 'String', required: true, lookupField: true },
          { name: 'data', type: 'JSON', required: true },
        ],
      };

      const appID = 'app-12345';
      const settingsData = { a: true, b: false, c: 'updated-string-value' };

      const input = {
        fields: { app_id: appID, data: settingsData },
      };

      return joint.upsertItem(spec, input)
        .then((data) => {
          expect(data.attributes.id).to.equal(1);
          expect(data.attributes.app_id).to.equal(appID);

          const dataJSON = JSON.parse(data.attributes.data);
          expect(dataJSON.c).to.equal('updated-string-value');
        });
    });
  }); // END - upsertItem

  // -------------------
  // Testing: updateItem
  // -------------------
  describe('updateItem', () => {
    before(() => resetDB(['projects']));

    it('should return an error (400) when the input does not provide a "lookupField"', () => {
      const spec = {
        modelName: 'Project',
        fields: [
          { name: 'id', type: 'Number', required: true, lookupField: true },
          { name: 'name', type: 'String' },
          { name: 'brief_description', type: 'String' },
        ],
      };
      const input = {
        fields: {
          name: 'Updated Name',
        },
      };

      return expect(joint.updateItem(spec, input))
        .to.eventually.be.rejectedWithJointStatusError(400);
    });

    it('should return an error (404) when the requested resource is not found', () => {
      const spec = {
        modelName: 'Project',
        fields: [
          { name: 'id', type: 'Number', required: true, lookupField: true },
          { name: 'name', type: 'String' },
          { name: 'brief_description', type: 'String' },
        ],
      };
      const input = {
        fields: {
          id: 999,
          name: 'Updated Name',
        },
      };

      return expect(joint.updateItem(spec, input))
        .to.eventually.be.rejectedWithJointStatusError(404);
    });

    it('should udpate the resource when the spec is satisfied', () => {
      const spec = {
        modelName: 'Project',
        fields: [
          { name: 'id', type: 'Number', required: true, lookupField: true },
          { name: 'name', type: 'String' },
          { name: 'brief_description', type: 'String' },
        ],
      };

      const id = 2;
      const name = 'Updated Name';

      const input = {
        fields: { id, name },
      };

      return joint.updateItem(spec, input)
        .then((data) => {
          expect(data.attributes).to.contain({
            id,
            name,
          });
        });
    });

    it('should support an "ownerCreds" authorization from a field on the looked-up item data', () => {
      const mockSession = {
        is_logged_in: true,
        id: 4,
        external_id: '304',
        username: 'the_manic_edge',
        roles: [],
        profile_ids: [1, 2, 3],
      };
      const mockRequest = {
        method: 'POST',
        originalUrl: '/api/project/4',
        session: { jointUser: mockSession },
      };
      const authRules = { owner: 'me' };
      const authBundle = AuthHandler.buildAuthBundle(mockRequest, authRules);

      const spec = {
        modelName: 'Project',
        fields: [
          { name: 'id', type: 'Number', required: true, lookupField: true },
          { name: 'name', type: 'String' },
          { name: 'brief_description', type: 'String' },
        ],
        auth: {
          ownerCreds: ['profile_id => profile_ids'],
        },
      };

      const input = {
        fields: {
          id: 4,
          name: 'A New Title for a New Day',
        },
        authBundle,
      };

      return expect(joint.updateItem(spec, input))
        .to.be.fulfilled;
    });
  }); // END - updateItem

  // ----------------
  // Testing: getItem
  // ----------------
  describe('getItem', () => {
    before(() => resetDB(['users', 'tags', 'profiles', 'projects']));

    it('should return the row according to the provided spec and input', () => {
      // ----
      // User
      // ----
      const specUser = {
        modelName: 'User',
        fields: [
          { name: 'id', type: 'Number', requiredOr: true },
          { name: 'external_id', type: 'String', requiredOr: true },
          { name: 'username', type: 'String' },
          { name: 'email', type: 'String' },
        ],
      };
      const inputUser = {
        fields: {
          external_id: '301',
        },
      };

      // -------
      // Profile
      // -------
      const specProfile = {
        modelName: 'Profile',
        fields: [
          { name: 'id', type: 'Number', requiredOr: true },
          { name: 'slug', type: 'String', requiredOr: true },
        ],
      };
      const inputProfile = {
        fields: {
          id: 1,
        },
      };

      const getUser = joint.getItem(specUser, inputUser)
        .then((data) => {
          expect(data)
            .to.have.property('attributes')
            .that.contains({
              id: 1,
              external_id: inputUser.fields.external_id,
            });
        });

      const getProfile = joint.getItem(specProfile, inputProfile)
        .then((data) => {
          expect(data)
            .to.have.property('attributes')
            .that.contains({
              id: inputProfile.fields.id,
              user_id: 4,
            });
        });

      return Promise.all([
        getUser,
        getProfile,
      ]);
    });

    it('should support an "ownerCreds" authorization from a field on the retrieved item data', () => {
      const mockSession = {
        is_logged_in: true,
        user_id: 4,
        external_id: '304',
        username: 'the_manic_edge',
        roles: ['moderator', 'admin'],
        profile_id: [1, 2, 3],
      };
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/project/4',
        session: { jointUser: mockSession },
      };
      const authRules = { owner: 'me' };
      const authBundle = AuthHandler.buildAuthBundle(mockRequest, authRules);

      const spec = {
        modelName: 'Project',
        fields: [
          { name: 'id', type: 'Number', required: true },
        ],
        auth: {
          ownerCreds: ['profile_id'],
        },
      };
      const input = {
        fields: { id: 4 },
        authBundle,
      };

      return expect(joint.getItem(spec, input))
        .to.be.fulfilled;
    });

    it('should only return the column data that is permitted by the spec', () => {
      const allAvailableCols = ['id', 'user_id', 'title', 'slug', 'tagline', 'description', 'is_default', 'is_live', 'created_at', 'updated_at'];

      const specBase = {
        modelName: 'Profile',
        fields: [
          { name: 'id', type: 'Number', requiredOr: true },
          { name: 'slug', type: 'String', requiredOr: true },
        ],
      };

      const specColsEmptyArray = Object.assign({}, specBase);
      specColsEmptyArray.columnsToReturn = [];

      const specColsSpecified = Object.assign({}, specBase);
      specColsSpecified.columnsToReturn = ['id', 'title', 'tagline'];

      const input = {
        fields: {
          id: 1,
        },
      };

      const getAllColsFromBase = joint.getItem(specBase, input)
        .then((data) => {
          expect(data.attributes).to.have.keys(allAvailableCols);
        });

      const getAllColsFromEmptyArray = joint.getItem(specColsEmptyArray, input)
        .then((data) => {
          expect(data.attributes).to.have.keys(allAvailableCols);
        });

      const getSpecifiedCols = joint.getItem(specColsSpecified, input)
        .then((data) => {
          expect(data.attributes).to.have.keys(specColsSpecified.columnsToReturn);
        });

      return Promise.all([getAllColsFromBase, getAllColsFromEmptyArray, getSpecifiedCols]);
    });

    it('should support the "columnSet" syntax, permitting various sets of returned column data', () => {
      const allAvailableCols = ['id', 'user_id', 'title', 'slug', 'tagline', 'description', 'is_default', 'is_live', 'created_at', 'updated_at'];

      const specBase = {
        modelName: 'Profile',
        fields: [
          { name: 'id', type: 'Number', requiredOr: true },
          { name: 'slug', type: 'String', requiredOr: true },
        ],
      };

      const specColsWithDefault = Object.assign({}, specBase);
      specColsWithDefault.columnsToReturn = {
        default: ['id', 'user_id', 'title', 'slug', 'tagline', 'description'],
        list: ['id', 'user_id', 'title'],
        tagline: ['user_id', 'tagline'],
      };

      const specColsWithoutDefault = Object.assign({}, specBase);
      specColsWithoutDefault.columnsToReturn = {
        list: ['id', 'user_id', 'title'],
        tagline: ['user_id', 'tagline'],
      };

      const inputWithUndefinedSet = {
        fields: { id: 1 },
        columnSet: 'unknown',
      };
      const inputWithDefaultSet = {
        fields: { id: 1 },
        columnSet: 'default',
      };
      const inputWithListSet = {
        fields: { id: 1 },
        columnSet: 'list',
      };

      const getAllColsWithBase = joint.getItem(specBase, inputWithListSet)
        .then((data) => {
          expect(data.attributes).to.have.keys(allAvailableCols);
        });

      const getDefaultSetImplicitly = joint.getItem(specColsWithDefault, inputWithUndefinedSet)
        .then((data) => {
          expect(data.attributes).to.have.keys(specColsWithDefault.columnsToReturn.default);
        });

      const getAllColsWithUnknownSetAndNoDefault = joint.getItem(specColsWithoutDefault, inputWithUndefinedSet)
        .then((data) => {
          expect(data.attributes).to.have.keys(allAvailableCols);
        });

      const getDefaultSetExplicitly = joint.getItem(specColsWithDefault, inputWithDefaultSet)
        .then((data) => {
          expect(data.attributes).to.have.keys(specColsWithDefault.columnsToReturn.default);
        });

      const getListSet = joint.getItem(specColsWithDefault, inputWithListSet)
        .then((data) => {
          expect(data.attributes).to.have.keys(specColsWithDefault.columnsToReturn.list);
        });

      return Promise.all([
        getAllColsWithBase,
        getDefaultSetImplicitly,
        getAllColsWithUnknownSetAndNoDefault,
        getDefaultSetExplicitly,
        getListSet,
      ]);
    });

    it('should return relation data when the "input.relations" property is used', () => {
      const relationName = 'profile';

      const specProject = {
        modelName: 'Project',
        fields: [
          { name: 'id', type: 'Number', required: true },
        ],
      };
      const inputProjectWithRelation = {
        fields: { id: 1 },
        relations: [relationName],
      };
      const inputProjectWithoutRelation = {
        fields: { id: 1 },
      };

      const withRelation = joint.getItem(specProject, inputProjectWithRelation)
        .then((data) => {
          expect(data)
            .to.have.property('relations')
            .that.has.property(relationName);
        });

      const withoutRelation = joint.getItem(specProject, inputProjectWithoutRelation)
        .then((data) => {
          expect(data)
            .to.have.property('relations')
            .that.is.empty;
        });

      return Promise.all([withRelation, withoutRelation]);
    });

    it('should load relation data directly to the base attributes when the "input.loadDirect" property is used', () => {
      const specProject = {
        modelName: 'Project',
        fields: [
          { name: 'id', type: 'Number', required: true },
        ],
      };
      const inputProject = {
        fields: { id: 2 },
        loadDirect: ['profile:title', 'user:username', 'codingLanguageTags:key'],
      };

      const withLoadDirect = joint.getItem(specProject, inputProject)
        .then((data) => {
          expect(data.attributes)
            .to.contain({
              profile: 'Heavy Synapse',
              user: 'the_manic_edge',
            });

          expect(data.attributes)
            .to.have.property('coding_language_tags')
            .that.has.members(['java', 'jsp', 'javascript']);

          expect(data)
            .to.have.property('relations')
            .that.is.empty;
        });

      return Promise.all([withLoadDirect]);
    });

    it('should support the combined usage of "input.relations" and "input.loadDirect" properties', () => {
      const specProject = {
        modelName: 'Project',
        fields: [
          { name: 'id', type: 'Number', required: true },
        ],
      };
      const inputProject = {
        fields: { id: 2 },
        relations: ['profile'],
        loadDirect: ['codingLanguageTags:key', 'user:username'],
      };

      const withBoth = joint.getItem(specProject, inputProject)
        .then((data) => {
          expect(data.attributes)
            .to.have.property('coding_language_tags')
            .that.has.members(['java', 'jsp', 'javascript']);

          expect(data.attributes)
            .to.contain({ user: 'the_manic_edge' });

          expect(data.relations).to.have.keys('profile');
        });

      return Promise.all([withBoth]);
    });
  }); // END - getItem

  // -----------------
  // Testing: getItems
  // -----------------
  describe('getItems', () => {
    before(() => resetDB(['users', 'tags', 'profiles', 'projects']));

    it('should return all rows according to the provided spec and input', () => {
      // ----
      // User
      // ----
      const specUser = {
        modelName: 'User',
        defaultOrderBy: '-created_at',
      };
      const inputUsers = {};

      // -------
      // Profile
      // -------
      const specProfile = {
        modelName: 'Profile',
        fields: [
          { name: 'user_id', type: 'Number' },
          { name: 'is_live', type: 'Boolean' },
        ],
        defaultOrderBy: '-created_at',
      };
      const inputAllProfiles = {};
      const inputLiveProfiles = {
        fields: {
          is_live: true,
        },
      };
      const inputNotLiveProfiles = {
        fields: {
          is_live: false,
        },
      };

      const getUsers = joint.getItems(specUser, inputUsers)
        .then((data) => {
          expect(data.models).to.have.length(10);
        });

      const getAllProfiles = joint.getItems(specProfile, inputAllProfiles)
        .then((data) => {
          expect(data.models).to.have.length(11);
        });

      const getLiveProfiles = joint.getItems(specProfile, inputLiveProfiles)
        .then((data) => {
          expect(data.models).to.have.length(7);
        });

      const getNotLiveProfiles = joint.getItems(specProfile, inputNotLiveProfiles)
        .then((data) => {
          expect(data.models).to.have.length(4);
        });

      return Promise.all([getUsers, getAllProfiles, getLiveProfiles, getNotLiveProfiles]);
    });

    it('should only return the column data that is permitted by the spec', () => {
      const allAvailableCols = ['id', 'external_id', 'email', 'username', 'display_name', 'avatar_url', 'last_login_at', 'created_at', 'updated_at'];

      const specBase = {
        modelName: 'User',
        defaultOrderBy: '-created_at',
      };

      const specColsSpecified = Object.assign({}, specBase);
      specColsSpecified.columnsToReturn = ['id', 'username', 'display_name'];

      const input = {};

      const getAllColsFromBase = joint.getItems(specBase, input)
        .then((data) => {
          expect(data.models[0].attributes).to.have.keys(allAvailableCols);
        });

      const getSpecifiedCols = joint.getItems(specColsSpecified, input)
        .then((data) => {
          expect(data.models[0].attributes).to.have.keys(specColsSpecified.columnsToReturn);
        });

      return Promise.all([getAllColsFromBase, getSpecifiedCols]);
    });

    it('should support the "columnSet" syntax, permitting various sets of returned column data', () => {
      const allAvailableCols = ['id', 'external_id', 'email', 'username', 'display_name', 'avatar_url', 'last_login_at', 'created_at', 'updated_at'];

      const specBase = {
        modelName: 'User',
        defaultOrderBy: '-created_at',
      };

      const specColsWithDefault = Object.assign({}, specBase);
      specColsWithDefault.columnsToReturn = {
        default: ['id', 'email', 'username', 'display_name', 'external_id'],
        list: ['id', 'username', 'display_name'],
        avatar: ['display_name', 'avatar_url'],
      };

      const specColsWithoutDefault = Object.assign({}, specBase);
      specColsWithoutDefault.columnsToReturn = {
        list: ['id', 'username', 'display_name'],
        avatar: ['display_name', 'avatar_url'],
      };

      const inputWithUndefinedSet = { columnSet: 'unknown' };
      const inputWithDefaultSet = { columnSet: 'default' };
      const inputWithListSet = { columnSet: 'list' };

      const getAllColsWithBase = joint.getItems(specBase, inputWithListSet)
        .then((data) => {
          expect(data.models[0].attributes).to.have.keys(allAvailableCols);
        });

      const getDefaultSetImplicitly = joint.getItems(specColsWithDefault, inputWithUndefinedSet)
        .then((data) => {
          expect(data.models[0].attributes).to.have.keys(specColsWithDefault.columnsToReturn.default);
        });

      const getAllColsWithUnknownSetAndNoDefault = joint.getItems(specColsWithoutDefault, inputWithUndefinedSet)
        .then((data) => {
          expect(data.models[0].attributes).to.have.keys(allAvailableCols);
        });

      const getDefaultSetExplicitly = joint.getItems(specColsWithDefault, inputWithDefaultSet)
        .then((data) => {
          expect(data.models[0].attributes).to.have.keys(specColsWithDefault.columnsToReturn.default);
        });

      const getListSet = joint.getItems(specColsWithDefault, inputWithListSet)
        .then((data) => {
          expect(data.models[0].attributes).to.have.keys(specColsWithDefault.columnsToReturn.list);
        });

      return Promise.all([
        getAllColsWithBase,
        getDefaultSetImplicitly,
        getAllColsWithUnknownSetAndNoDefault,
        getDefaultSetExplicitly,
        getListSet,
      ]);
    });

    it('should return relation data when the "input.relations" property is used', () => {
      const specProject = {
        modelName: 'Project',
        fields: [
          { name: 'profile_id', type: 'Number' },
        ],
        defaultOrderBy: '-updated_at',
      };
      const inputProjectWithRelation = {
        fields: { profile_id: 2 },
        relations: ['profile'],
      };
      const inputProjectWithoutRelation = {
        fields: { profile_id: 2 },
      };

      const withRelation = joint.getItems(specProject, inputProjectWithRelation)
        .then((data) => {
          expect(data.models[0])
            .to.have.property('relations')
            .that.has.property('profile');

          const firstProject = data.models[0];
          const profileData = firstProject.relations.profile;
          expect(profileData)
            .to.have.property('attributes')
            .that.contains({ id: 2 });
        });

      const withoutRelation = joint.getItems(specProject, inputProjectWithoutRelation)
        .then((data) => {
          expect(data.models[0])
            .to.have.property('relations')
            .that.is.empty;
        });

      return Promise.all([withRelation, withoutRelation]);
    });

    it('should load relation data directly to the base attributes when the "input.relations" property is used', () => {
      const specProject = {
        modelName: 'Project',
        fields: [
          { name: 'profile_id', type: 'Number' },
        ],
        defaultOrderBy: '-updated_at',
      };

      const inputProject = {
        fields: { profile_id: 2 },
        loadDirect: ['user:username', 'codingLanguageTags:key'],
      };

      const withLoadDirect = joint.getItems(specProject, inputProject)
        .then((data) => {
          const secondProject = data.models[1];

          expect(secondProject.attributes)
            .to.contain({ user: 'the_manic_edge' });

          expect(secondProject.attributes)
            .to.have.property('coding_language_tags')
            .that.has.members(['java', 'jsp', 'xslt', 'html']);

          expect(secondProject)
            .to.have.property('relations')
            .that.is.empty;
        });

      return Promise.all([withLoadDirect]);
    });

    it('should support the combined usage of "input.relations" and "input.loadDirect" properties', () => {
      const specProject = {
        modelName: 'Project',
        fields: [
          { name: 'profile_id', type: 'Number' },
        ],
        defaultOrderBy: '-updated_at',
      };

      const inputProject = {
        fields: { profile_id: 2 },
        relations: ['profile'],
        loadDirect: ['user:username', 'codingLanguageTags:key'],
      };

      const withBoth = joint.getItems(specProject, inputProject)
        .then((data) => {
          const thirdProject = data.models[2];

          expect(thirdProject.attributes)
            .to.contain({ user: 'the_manic_edge' });

          expect(thirdProject.attributes)
            .to.have.property('coding_language_tags')
            .that.has.members(['javascript', 'coffee-script']);

          expect(thirdProject.relations).to.have.keys('profile');
        });

      return Promise.all([withBoth]);
    });

    it('should return paginated results when the "input.paginate" option is used', () => {
      const specProject = {
        modelName: 'Project',
        fields: [
          { name: 'profile_id', type: 'Number' },
        ],
        defaultOrderBy: '-updated_at',
      };
      const inputFirstThree = {
        fields: { profile_id: 11 },
        paginate: { skip: 0, limit: 3 },
      };
      const inputSecondThree = {
        fields: { profile_id: 11 },
        paginate: { skip: 3, limit: 3 },
      };
      const inputThirdAndFourth = {
        fields: { profile_id: 11 },
        paginate: { skip: 2, limit: 2 },
      };
      const inputTheRest = {
        fields: { profile_id: 11 },
        paginate: { skip: 6, limit: 99 },
      };

      const firstThree = joint.getItems(specProject, inputFirstThree)
        .then((data) => {
          expect(data.models).to.have.length(3);
          expect(data.models[0]).to.contain({ id: 5 });
          expect(data.models[1]).to.contain({ id: 6 });
          expect(data.models[2]).to.contain({ id: 7 });
        });

      const secondThree = joint.getItems(specProject, inputSecondThree)
        .then((data) => {
          expect(data.models).to.have.length(3);
          expect(data.models[0]).to.contain({ id: 8 });
          expect(data.models[1]).to.contain({ id: 9 });
          expect(data.models[2]).to.contain({ id: 10 });
        });

      const theThirdAndFourth = joint.getItems(specProject, inputThirdAndFourth)
        .then((data) => {
          expect(data.models).to.have.length(2);
          expect(data.models[0]).to.contain({ id: 7 });
          expect(data.models[1]).to.contain({ id: 8 });
        });

      const theRest = joint.getItems(specProject, inputTheRest)
        .then((data) => {
          expect(data.models).to.have.length(4);
          expect(data.models[0]).to.contain({ id: 11 });
          expect(data.models[1]).to.contain({ id: 12 });
          expect(data.models[2]).to.contain({ id: 13 });
          expect(data.models[3]).to.contain({ id: 14 });
        });

      return Promise.all([firstThree, secondThree, theThirdAndFourth, theRest]);
    });

    it('should return an empty array when requesting a pagination offset that does not exist', () => {
      const specProject = {
        modelName: 'Project',
        fields: [
          { name: 'profile_id', type: 'Number' },
        ],
        defaultOrderBy: '-updated_at',
      };
      const inputProjects = {
        fields: { profile_id: 11 },
        paginate: { skip: 99999, limit: 10 },
      };

      return joint.getItems(specProject, inputProjects)
        .then((data) => {
          expect(data.models).to.have.length(0);
        });
    });

    it('should order the results according to the "spec.defaultOrderBy" and "input.orderBy" options', () => {
      // -------
      // Profile
      // -------
      const specProfile = {
        modelName: 'Profile',
        defaultOrderBy: '-created_at',
      };
      const profilesDefaultOrder = {};

      // -------
      // Project
      // -------
      const specProject = {
        modelName: 'Project',
        fields: [
          { name: 'profile_id', type: 'Number' },
        ],
        defaultOrderBy: '-updated_at',
      };
      const projectsDefaultOrder = {
        fields: {
          profile_id: 11,
        },
      };
      const projectsNameASC = {
        fields: {
          profile_id: 11,
        },
        orderBy: 'name',
      };

      const getProfilesInDefaultOrder = joint.getItems(specProfile, profilesDefaultOrder)
        .then((data) => {
          expect(data.models).to.have.length(11);
          expect(data.models[0]).to.contain({ id: 1 });
          expect(data.models[1]).to.contain({ id: 2 });
          expect(data.models[2]).to.contain({ id: 3 });
          expect(data.models[3]).to.contain({ id: 4 });
          expect(data.models[4]).to.contain({ id: 5 });
          expect(data.models[5]).to.contain({ id: 6 });
          expect(data.models[6]).to.contain({ id: 7 });
          expect(data.models[7]).to.contain({ id: 8 });
          expect(data.models[8]).to.contain({ id: 9 });
          expect(data.models[9]).to.contain({ id: 10 });
          expect(data.models[10]).to.contain({ id: 11 });
        });

      const getProjectsInDefaultOrder = joint.getItems(specProject, projectsDefaultOrder)
        .then((data) => {
          expect(data.models).to.have.length(10);
          expect(data.models[0]).to.contain({ id: 5 });
          expect(data.models[1]).to.contain({ id: 6 });
          expect(data.models[2]).to.contain({ id: 7 });
          expect(data.models[3]).to.contain({ id: 8 });
          expect(data.models[4]).to.contain({ id: 9 });
          expect(data.models[5]).to.contain({ id: 10 });
          expect(data.models[6]).to.contain({ id: 11 });
          expect(data.models[7]).to.contain({ id: 12 });
          expect(data.models[8]).to.contain({ id: 13 });
          expect(data.models[9]).to.contain({ id: 14 });
        });

      const getProjectsInNameASC = joint.getItems(specProject, projectsNameASC)
        .then((data) => {
          expect(data.models).to.have.length(10);
          expect(data.models[0]).to.contain({ id: 12 }); // A
          expect(data.models[1]).to.contain({ id: 5 });  // E
          expect(data.models[2]).to.contain({ id: 11 }); // H
          expect(data.models[3]).to.contain({ id: 6 });  // J
          expect(data.models[4]).to.contain({ id: 14 }); // K
          expect(data.models[5]).to.contain({ id: 9 });  // L
          expect(data.models[6]).to.contain({ id: 13 }); // N
          expect(data.models[7]).to.contain({ id: 7 });  // P
          expect(data.models[8]).to.contain({ id: 10 }); // T
          expect(data.models[9]).to.contain({ id: 8 });  // W
        });

      return Promise.all([
        getProfilesInDefaultOrder,
        getProjectsInDefaultOrder,
        getProjectsInNameASC,
      ]);
    });
  }); // END - getItems

  // -------------------
  // Testing: deleteItem
  // -------------------
  describe('deleteItem', () => {
    before(() => resetDB(['profiles', 'projects']));

    it('should return an error (404) when the requested resource is not found', () => {
      const spec = {
        modelName: 'Project',
        fields: [
          { name: 'id', type: 'Number', required: true },
        ],
      };
      const input = {
        fields: {
          id: 999,
        },
      };

      return expect(joint.deleteItem(spec, input))
        .to.eventually.be.rejectedWithJointStatusError(404);
    });

    it('should delete the resource when the spec is satisfied', () => {
      const spec = {
        modelName: 'Profile',
        fields: [
          { name: 'id', type: 'Number', required: true },
        ],
      };

      const input = {
        fields: {
          id: 1,
        },
      };

      return joint.deleteItem(spec, input)
        .then((data) => {
          expect(data.attributes).to.be.empty;

          return expect(joint.getItem(spec, input))
            .to.eventually.be.rejectedWithJointStatusError(404);
        });
    });

    it('should support the "lookupField" option, in order to defer authorization on the retrieved item', () => {
      const mockSession = {
        is_logged_in: true,
        id: 4,
        external_id: '304',
        username: 'the_manic_edge',
        roles: [],
        profile_ids: [1, 2, 3],
      };
      const mockRequest = {
        method: 'DELETE',
        originalUrl: '/api/project/4',
        session: { jointUser: mockSession },
      };
      const authRules = { owner: 'me' };
      const authBundle = AuthHandler.buildAuthBundle(mockRequest, authRules);

      const spec = {
        modelName: 'Project',
        fields: [
          { name: 'id', type: 'Number', required: true, lookupField: true },
        ],
        auth: {
          ownerCreds: ['profile_id => profile_ids'],
        },
      };

      const input = {
        fields: { id: 4 },
        authBundle,
      };

      return expect(joint.deleteItem(spec, input))
        .to.be.fulfilled;
    });
  }); // END - deleteItem

});