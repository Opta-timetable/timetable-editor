'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var subjects = require('../../app/controllers/subjects.server.controller');

	// Subjects Routes
	app.route('/subjects')
		.get(subjects.list)
		.post(users.requiresLogin, subjects.create);

	app.route('/subjects/:subjectId')
		.get(subjects.read)
		.put(users.requiresLogin, subjects.hasAuthorization, subjects.update)
		.delete(users.requiresLogin, subjects.hasAuthorization, subjects.delete);

	// Finish by binding the Subject middleware
	app.param('subjectId', subjects.subjectByID);
};
