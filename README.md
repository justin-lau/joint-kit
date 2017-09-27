# Joint Lib
> Part of the Joint Stack

A Node server library for rapidly implementing data logic and generating RESTful
endpoints.

Designed to be flexible. Mix it with existing code and/or use it to
generate an entire custom method library and client API from scratch.

Provides: DB Model configuration, CRUD and relational data logic, Authorization,
Data transformation, Payload serialization, HTTP router generation (for RESTful endpoints), and more.


## Table of Contents

* [Prerequisites][section-prerequisites]
* [Install][section-install]
* [The Concept][section-the-concept]
* [Joint Actions][section-joint-actions]
* [The JSON Syntax][section-the-json-syntax]
* [Generating Models][section-generating-models]
* [Generating Custom Methods][section-generating-custom-methods]
* [Generating a RESTful API][section-generating-a-restful-api]
* [The Joint Stack][section-the-joint-stack]
* [License][section-license]


## Prerequisites

To use the Joint Library, you need:

* a supported persistence solution (e.g. Postgres)
* a configured data schema (e.g. database and tables)
* a supported service interface / ORM (e.g. Bookshelf)

The Joint Library currently supports:

| Service                              | Required Plugins                              | Persistence Options          |
| ------------------------------------ | --------------------------------------------- | ---------------------------- |
| [Bookshelf][link-bookshelf-site]     | [registry][link-bookshelf-plugin-registry], [pagination][link-bookshelf-plugin-pagination] | Postgres, MySQL, SQLite3     |


<br />


To generate a RESTful API on top of your custom methods, you need:

* a supported server framework (e.g. Express)

The Joint Library currently supports:

| Server                          |
| ------------------------------- |
| [Express][link-express-site]    |


## Install

``` sh
$ npm install joint-lib --save
```


## The Concept

Out-of-the-box, you can use any of the Joint Actions to handle common CRUD and relational data logic.

Given you have established a `bookshelf.js` configuration file (which hooks to your database) and you have registered a set of Models upon which to operate...

The conceptual idea of the library goes like this:

```javascript
import Joint from 'joint-lib';
import bookshelf from './services/bookshelf';

// Fire up a joint, specifying your Bookshelf configuration:
const joint = new Joint({
  service: bookshelf,
});

// The "spec" defines the functionality of your operation, and the fields permitted:
const spec = {
  modelName: 'BlogProfile',
  fields: [
    { name: 'user_id', type: 'Number', required: true },
    { name: 'slug', type: 'String', required: true },
    { name: 'title', type: 'String', required: true },
    { name: 'tagline', type: 'String' },
    { name: 'is_live', type: 'Boolean', defaultValue: false },
  ],
};

// The "input" supplies the data for an individual operation request:
const input = {
  fields: {
    user_id: 3,
    title: 'Functional Fanatic',
    slug: 'functional-fanatic',
    tagline: 'I don\'t have habits, I have algorithms.',
  },
};

// Leverage the appropriate Joint Action to handle the operation:
joint.createItem(spec, input)
  .then((result) => { ... })
  .catch((error) => { ... });
```

<br />

/resources/models.js
```javascript
import bookshelf from '../services/bookshelf';

const BlogProfile = bookshelf.Model.extend({
  tableName: 'blog_profiles',
  hasTimestamps: ['created_at', 'updated_at'],
  user() {
    return this.belongsTo('User', 'user_id');
  },
  posts() {
    return this.hasMany('BlogPost', 'profile_id');
  },
  tags() {
    return this.hasMany('Tag').through('ProfileTag', 'id', 'profile_id', 'tag_id');
  },
});

// Model added to Bookshelf registry...
bookshelf.model('BlogProfile', BlogProfile),
```

<br />

/services/bookshelf.js
```javascript
// Configure knex...
const knex = require('knex')({ ... });

// Initialize bookshelf...
const bookshelf = require('bookshelf')(knex);

// Enable required plugins...
bookshelf.plugin('registry');
bookshelf.plugin('pagination');

export default bookshelf;
```

<br />

### In Practice

The idea is, you can rapidly implement a custom method library (manually) by wrapping custom functions around
the Joint Actions, with a defined `spec`:

<br />

**For Example:**

/methods/blog-profile.js
```javascript
export function createProfile(input) {
  const spec = {
    modelName: 'BlogProfile',
    fields: [
      { name: 'user_id', type: 'Number', required: true },
      { name: 'slug', type: 'String', required: true },
      { name: 'title', type: 'String', required: true },
      { name: 'tagline', type: 'String' },
      { name: 'is_live', type: 'Boolean', defaultValue: false },
    ],
  };

  return joint.createItem(spec, input);
}

export function updateProfile(input) {
  const spec = {
    modelName: 'BlogProfile',
    fields: [
      { name: 'id', type: 'Number', required: true, lookupField: true },
      { name: 'slug', type: 'String' },
      { name: 'title', type: 'String' },
      { name: 'tagline', type: 'String' },
      { name: 'is_live', type: 'Boolean'},
    ],
  };

  return joint.updateItem(spec, input);
}

export function getProfile(input) {
  const spec = {
    modelName: 'BlogProfile',
    fields: [
      { name: 'id', type: 'Number', requiredOr: true },
      { name: 'slug', type: 'String', requiredOr: true },
    ],
  };

  return joint.getItem(spec, input);
}

export function getProfiles(input) {
  const spec = {
    modelName: 'BlogProfile',
    fields: [
      { name: 'user_id', type: 'Number' },
      { name: 'is_live', type: 'Boolean'},
    ],
  };

  return joint.getItems(spec, input);
}

export function deleteProfile(input) {
  const spec = {
    modelName: 'BlogProfile',
    fields: [
      { name: 'id', type: 'Number', requiredOr: true },
      { name: 'slug', type: 'String', requiredOr: true },
    ],
  };

  return joint.deleteItem(spec, input);
}
```

<br />

And, the beauty of the manual capability is that you can leverage the core logic behind each action
(which typically represents the majority of the programming), while maintaining the flexibility to write
your customized logic alongside:

<br />

**For Example:**

```javascript
export function createProfile(input) {
  const spec = {
    modelName: 'BlogProfile',
    fields: [
      { name: 'user_id', type: 'Number', required: true },
      { name: 'slug', type: 'String', required: true },
      { name: 'title', type: 'String' },
      { name: 'tagline', type: 'String' },
      { name: 'is_live', type: 'Boolean', defaultValue: false },
    ],
  };

  // Generate default title, if none provided...
  const defaultInput = { title: `New Profile ${Date()}` };
  const inputForCreate = Object.assign(defaultInput, input);

  return joint.createItem(spec, inputForCreate);
}

export function getLiveProfiles(input) {
  const spec = {
    modelName: 'BlogProfile',
    fields: [
      { name: 'user_id', type: 'Number' },
      { name: 'is_live', type: 'Boolean'},
    ],
  };

  // Force only "live" profiles to be returned...
  Object.assign(input, { is_live: true });

  return joint.getItems(spec, input);
}

export function getProfile(input) {
  const spec = {
    modelName: 'BlogProfile',
    fields: [
      { name: 'id', type: 'Number', requiredOr: true },
      { name: 'slug', type: 'String', requiredOr: true },
    ],
  };

  // Apply "other" logic to the queried data...
  return joint.getItem(spec, input)
    .then((item) => {
      // Mutate the data before return...
      Object.assign(item, { ... });

      // Apply third-party service logic before return...
      return doOtherAsyncLogic(item);
    });
}
```

<br />

But, if you don't require any supplemental logic for an operation, bypass the manual rolling of the method
entirely and generate the methods automatically from a JSON-based config file.

<br />

**For Example:**

method-config.js
```javascript
export default {
  resources: [
    {
      modelName: 'BlogProfile',
      methods: [
        {
          name: 'createBlogProfile',
          action: 'createItem',
          spec: {
            fields: [
              { name: 'user_id', type: 'Number', required: true },
              { name: 'slug', type: 'String', required: true },
              { name: 'title', type: 'String' },
              { name: 'tagline', type: 'String' },
              { name: 'is_live', type: 'Boolean', defaultValue: false },
            ],
          },
        },
        {
          name: 'getBlogProfiles',
          action: 'getItems',
          spec: {
            fields: [
              { name: 'id', type: 'Number', requiredOr: true },
              { name: 'slug', type: 'String', requiredOr: true },
            ],
          },
        },

        ... other methods

      ],
    },

    ... other resources (models)

  ],
};
```

Then, use the Joint `generate` function to dynamically generate your custom method library:

```javascript
import Joint from 'joint-lib';
import bookshelf from './services/bookshelf';
import methodConfig from './method-config';

const joint = new Joint({
  service: bookshelf,
});

// Dynamically generate the defined methods...
joint.generate({ methodConfig });

// You can now utilize the methods using the syntax:
joint.method.BlogProfile.createBlogProfile(input)
  .then((result) => { ... })
  .catch((error) => { ... });
```

<br />

Joint also supports a JSON syntax for defining your Models, so you don't need to manually define or register
the model hook via Bookshelf. The syntax supports an arrow notation for defining associations (relations),
making it easier to wield than the Bookshelf polymorphic method approach.

<br />

**For Example:**

model-config.js
```javascript

export default {
  models: {
    // Define and register a Model named: "BlogProfile"...
    BlogProfile: {
      tableName: 'blog_profiles',
      timestamps: { created: 'created_at', updated: 'updated_at' },
      associations: {
        user: {
          type: 'toOne',
          path: 'user_id => User.id', // one-to-one
        },
        posts: {
          type: 'toMany',
          path: 'id => BlogPost.profile_id', // one-to-many
        },
        tags: {
          type: 'toMany',
          path: 'id => ProfileTag.profile_id => ProfileTag.tag_id => Tag.id', // many-to-many
        },
      },
    },

    ... other models

  },
};
```

Similarly, use the Joint `generate` function to dynamically generate your models.
Any manually defined models on your bookshelf config will be merged into the Joint
instance along with those defined in the model-config. So, you can use both approaches as you see fit:

```javascript
import Joint from 'joint-lib';
import bookshelf from './services/bookshelf';
import modelConfig from './model-config';
import methodConfig from './method-config';

const joint = new Joint({
  service: bookshelf,
});

// Dynamically generate the defined models and methods...
joint.generate({ modelConfig, methodConfig });

// You can access all models using the syntax joint.model.<modelName>:
if (joint.model.BlogProfile) console.log('BlogProfile exists !!!');

// Convenience mappings are also generated, allowing lookup of model object or name via the table name:
const BlogProfile = joint.modelByTable['blog_profiles'];
const modelName = joint.modelNameByTable['blog_profiles'];
console.log(`The model name for table "blog_profiles" is: ${modelName}`);
```


## Joint Actions

All Joint actions return Promises, and have the same method signature:

```javascript
joint.<action>(spec = {}, input = {}, output = 'native')
  .then((payload) => { ... })
  .catch((error) => { ... });
```

The following abstract actions are immediately available once the library is installed:

| Action                   | Description                                                               |
| ------------------------ | ------------------------------------------------------------------------- |
| createItem               | Create operation for a single item                                        |
| upsertItem               | Upsert operation for a single item                                        |
| updateItem               | Update operation for a single item                                        |
| getItem                  | Read operation for retrieving a single item                               |
| getItems                 | Read operation for retrieving a collection of items                       |
| deleteItems              | Delete operation for one to many items                                    |
| addAssociatedItems       | Operation for associating one to many items to a main resource            |
| hasAssociatedItem        | Operation for checking the existence of an association on a main resource |
| getAssociatedItems       | Operation for retrieving all associations of a type from a main resource  |
| removeAssociatedItems    | Operation for disassociating one to many items from a main resource       |
| removeAllAssociatedItems | Operation for removing all associations of a type from a main resource    |


See the [Action Guide][link-action-guide-bookshelf] for details on using each action.


## The JSON Syntax

To use the Joint Actions, you communicate with a JSON syntax.

Each action has two required parts: the `spec` and the `input`.

+ The `spec` defines the functionality of the action.

+ The `input` supplies the data for an individual action request.

<br />

Each action also supports an optional `output` parameter, which specifies the format of the returned payload.
By default, the output is set to `'native'`, which effectively returns the queried data in the format
generated natively by the service (currently, i.e. Bookshelf).

However, Joint also supports the value `'json-api'`, which transforms the data into a JSON API Spec-like format,
making it ready-to-use for RESTful data transport.

**output = 'native' (default)**
```
const joint = new Joint({
  service: bookshelf,
});
```

example payload:
```
<show example payload>
```

**output = 'json-api'**
```javascript
const joint = new Joint({
  service: bookshelf,
  output: 'json-api',
});
```

example payload:
```
<show example payload>
```

<br />

See the [Action Guide][link-action-guide-bookshelf] for details on using the notation.


## Generating Models

Dynamic model generation is also supported using the library's JSON syntax.

You can write the model definitions yourself (and make them as complex as you want),
or you can dynamically generate them by providing a "model config". Or, you can do both.

Any existing models registered to your service instance will be mixed-in with those
generated by Joint. The `method-config` and `route-config` definitions can therefore
operate on models registered by either means.

[TBC]


## Generating Custom Methods

Using the provided Joint Actions, you can rapidly implement custom methods
for your specific data schema.

To implement custom methods, you can write your own JavaScript functions by directly accessing
the `joint.<action>` set, or you can dynamically generate them by providing a "method config".

[TBC]

[Show code for `method-config.js` & application code using `joint.method.<model>.<method>`]


See the [Action Guide][link-action-guide-bookshelf] for more details.


## Generating a RESTful API

This feature is only available for dynamically-generated custom methods.

To dynamically generate RESTful endpoints for your custom methods, you must
provide a "route config".

[TBC]


## The Joint Stack

[TBC]


## License

[TBD]


[section-prerequisites]: #prerequisites
[section-install]: #install
[section-the-concept]: #the-concept
[section-joint-actions]: #joint-actions
[section-the-json-syntax]: #the-json-syntax
[section-generating-models]: #generating-models
[section-generating-custom-methods]: #generating-custom-methods
[section-generating-a-restful-api]: #generating-a-restful-api
[section-the-joint-stack]: #the-joint-stack
[section-license]: #license

[link-bookshelf-site]: http://bookshelfjs.org
[link-bookshelf-plugin-registry]: https://github.com/bookshelf/bookshelf/wiki/Plugin:-Model-Registry
[link-bookshelf-plugin-pagination]: https://github.com/bookshelf/bookshelf/wiki/Plugin:-Pagination
[link-action-guide-bookshelf]: https://github.com/manicprone/joint-lib/blob/master/src/actions/README.md

[link-express-site]: http://expressjs.com
