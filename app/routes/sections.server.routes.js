'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var sections = require('../../app/controllers/sections.server.controller');

	// Sections Routes
	app.route('/sections')
		.get(users.requiresLogin, sections.list)
		.post(users.requiresLogin, sections.create);

	app.route('/sections/:sectionId')
		.get(users.requiresLogin, sections.read)
		.put(users.requiresLogin, sections.hasAuthorization, sections.update)
		.delete(users.requiresLogin, sections.hasAuthorization, sections.delete);

	// Finish by binding the Section middleware
	app.param('sectionId', sections.sectionByID);
};
