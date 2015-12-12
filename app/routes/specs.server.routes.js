'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var specs = require('../../app/controllers/specs.server.controller');

	// Specs Routes
	app.route('/specs')
		.get(specs.list)
		.post(users.requiresLogin, specs.create);

	app.route('/specs/:specId')
		.get(specs.read)
		.put(users.requiresLogin, specs.hasAuthorization, specs.update)
		.delete(users.requiresLogin, specs.hasAuthorization, specs.delete);

  app.route('/specs/upload')
      .post(specs.uploadSpecFile);

  app.route('/specs/:specId/generate')
    .post(specs.generateSpecFile);

  app.route('/specs/solve')
    .post(specs.solve);

  app.route('/specs/:specId/solution')
    .get(specs.isSolving);

  app.route('/specs/:specId/solution')
    .delete(specs.terminateSolving);

  app.route('/specs/:specId/solutionFile')
    .get(specs.getSolvedXML);

  app.route('/specs/:specId/teachers')
      .get(specs.listTeachers);

  app.route('/specs/:specId/sections')
    .get(specs.getSectionsForSpec)
    .post(specs.addSectionsForSpec);

  app.route('/specs/:specId/assignments')
    .get(specs.getAssignmentsForSpec)
    .put(specs.addAssignmentsForSpec)
    .post(specs.updateAssignmentsForSpec);

	// Finish by binding the Spec middleware
	app.param('specId', specs.specByID);
};
