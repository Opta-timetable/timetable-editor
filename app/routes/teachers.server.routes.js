'use strict';

module.exports = function (app) {
  var users = require('../../app/controllers/users.server.controller');
  var teachers = require('../../app/controllers/teachers.server.controller');

  // Teachers Routes
  app.route('/teachers')
    .get(users.requiresLogin, teachers.list)
    .post(users.requiresLogin, teachers.create);

  app.route('/teachers/:specId')
    .get(users.requiresLogin, teachers.list)
    .post(users.requiresLogin, teachers.create);

  app.route('/teachers/:specId/teacher/:id')
    .get(users.requiresLogin, teachers.read)
    .put(users.requiresLogin, teachers.hasAuthorization, teachers.update)
    .delete(users.requiresLogin, teachers.hasAuthorization, teachers.delete);

  // Finish by binding the Teacher middleware
  app.param('teacherId', teachers.teacherByID);
};
