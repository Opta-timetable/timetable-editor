'use strict';

var users = require('../../app/controllers/users.server.controller'),
  courses = require('../../app/controllers/courses.server.controller');

module.exports = function(app) {
  // Course Routes
  app.route('/courses')
    .get(courses.list)
    .post(users.requiresLogin, courses.create);

  app.route('/courses/:courseId')
    .get(courses.read)
    .put(users.requiresLogin, courses.hasAuthorization, courses.update)
    .delete(users.requiresLogin, courses.hasAuthorization, courses.delete);

  // Finish by binding the course middleware
  app.param('courseId', courses.courseByID);
};
