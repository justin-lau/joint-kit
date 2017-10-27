// --------------------------------
// Routes for scenario: project-app
// (route-config)
// --------------------------------

module.exports = {

  routes: [
    // -------------------------------------------------------------------- User
    {
      uri: '/user',
      get: { method: 'User.getUser' },
      post: { method: 'User.createUser', successStatus: 201, body: true },
    },
    {
      uri: '/user/:id',
      get: { method: 'User.getUser' },
      post: { method: 'User.updateUser', body: true },
      delete: { method: 'User.deleteUser', successStatus: 204, query: false },
    },
    {
      uri: '/users',
      get: { method: 'User.getUsers' },
    },
  ], // END - routes

};
