'use strict';

var users = require('../../app/controllers/users.server.controller'),
    courses = require('../../app/controllers/courses.server.controller'),
    timetables = require('../../app/controllers/timetables.server.controller');

module.exports = function(app) {
    // Course Routes
    app.route('/timetables')
        .get(timetables.list);
        //.post(users.requiresLogin, timetables.create); //Later

    app.route('/timetables/:curriculumID')
        .get(timetables.read);
        //.put(users.requiresLogin, timetables.hasAuthorization, timetables.update)
        //.delete(users.requiresLogin, timetables.hasAuthorization, timetables.delete);

    // Finish by binding the course middleware
    app.param('curriculumID', timetables.timetableByCurriculumID);
};
