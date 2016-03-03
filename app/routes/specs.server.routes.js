'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var specs = require('../../app/controllers/specs.server.controller');

	// Specs Routes
	app.route('/specs')
		.get(users.requiresLogin, specs.list)
		.post(users.requiresLogin, specs.create);

	app.route('/specs/:specId')
		.get(specs.read)
		.put(users.requiresLogin, specs.hasAuthorization, specs.update)
		.delete(users.requiresLogin, specs.hasAuthorization, specs.delete);

  app.route('/specs/upload')
      .post(users.requiresLogin, specs.uploadSpecFile);

  app.route('/specs/:specId/generate')
    .post(users.requiresLogin, specs.generateSpecFile);

  app.route('/specs/solve')
    .post(users.requiresLogin, specs.solve);

  app.route('/specs/:specId/solution')
    .get(users.requiresLogin, specs.isSolving);

  app.route('/specs/:specId/solution')
    .delete(users.requiresLogin, specs.terminateSolving);

  app.route('/specs/:specId/solutionFile')
    .get(users.requiresLogin, specs.getSolvedXML);

  app.route('/specs/:specId/teachers')
      .get(users.requiresLogin, specs.listTeachers);

  app.route('/specs/:specId/sections')
    .get(users.requiresLogin, specs.getSectionsForSpec)
    .post(users.requiresLogin, specs.addSectionsForSpec);

  app.route('/specs/:specId/assignments')
    .get(users.requiresLogin, specs.getAssignmentsForSpec)
    //.put(specs.addAssignmentsForSpec)
    .post(users.requiresLogin, specs.updateAssignmentsForSpec);

	// Finish by binding the Spec middleware
	app.param('specId', specs.specByID);
};
