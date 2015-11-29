'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var schools = require('../../app/controllers/schools.server.controller');

	// Schools Routes
	app.route('/schools')
		.get(schools.list)
		.post(users.requiresLogin, schools.create);

	app.route('/schools/:schoolId')
		.get(schools.read)
		.put(users.requiresLogin, schools.hasAuthorization, schools.update)
		.delete(users.requiresLogin, schools.hasAuthorization, schools.delete);

	// Finish by binding the School middleware
	app.param('schoolId', schools.schoolByID);
};
