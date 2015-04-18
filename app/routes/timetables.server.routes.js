'use strict';

var users = require('../../app/controllers/users.server.controller'),
    courses = require('../../app/controllers/courses.server.controller'),
    timetables = require('../../app/controllers/timetables.server.controller');

module.exports = function(app) {
    // Course Routes
    app.route('/timetables')
        .get(timetables.list);
        //.post(users.requiresLogin, timetables.create); //Later

    app.route('/timetables/:curriculumId')
        .get(timetables.timetableByCurriculumID)
        .put(timetables.update);
        //.delete(users.requiresLogin, timetables.hasAuthorization, timetables.delete);

    app.param('curriculumId', timetables.read);

    app.route('/timetables/performDrop')
        .post(timetables.performDrop);

    app.route('/timetables/discoverClashes')
        .post(timetables.discoverClashes);



    //app.route('/timetables/:curriculumId');

};
