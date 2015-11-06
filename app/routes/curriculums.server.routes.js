'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var curriculums = require('../../app/controllers/curriculums.server.controller');

	// Curriculums Routes
	app.route('/curriculums')
		.get(curriculums.list)
		.post(users.requiresLogin, curriculums.create);

	app.route('/curriculums/:curriculumId')
		.get(curriculums.read)
		.put(users.requiresLogin, curriculums.hasAuthorization, curriculums.update)
		.delete(users.requiresLogin, curriculums.hasAuthorization, curriculums.delete);

	// Finish by binding the Curriculum middleware
	app.param('curriculumId', curriculums.curriculumByID);
};
