'use strict';

var users = require('../../app/controllers/users.server.controller'),
  courses = require('../../app/controllers/courses.server.controller'),
  timetables = require('../../app/controllers/timetables.server.controller');

module.exports = function (app) {
  // Course Routes
  app.route('/timetables')
    .get(users.requiresLogin, timetables.list);

  app.route('/timetables/:specId')
    .get(users.requiresLogin, timetables.timetableForSpec);
  //.post(users.requiresLogin, timetables.create); //Later

  app.route('/timetables/:specId/curriculum/:id')
    .get(users.requiresLogin, timetables.timetableByCurriculum)
    .put(users.requiresLogin, timetables.update);
  //.delete(users.requiresLogin, timetables.hasAuthorization, timetables.delete);

  app.route('/timetables/:specId/modifyPeriodAllocation')
    .post(users.requiresLogin, timetables.modifyPeriodAllocation);

  app.route('/timetables/:specId/discoverClashes')
    .post(users.requiresLogin, timetables.discoverClashes);

  app.route('/timetables/:specId/teacher/:id')
    .get(users.requiresLogin, timetables.timetableByTeacherID);

  app.route('/timetables/:specId/collectStats')
    .post(users.requiresLogin, timetables.collectStats);

  app.route('/timetables/:specId/day/:dayIndex')
    .get(users.requiresLogin, timetables.timetableByDayIndex);

  app.route('/timetables/:specId/changeTeacherAssignment')
    .post(users.requiresLogin, timetables.changeTeacherAssignment);
  
  app.param('curriculumId', timetables.read);

};
