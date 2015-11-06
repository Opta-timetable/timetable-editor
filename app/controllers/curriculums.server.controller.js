'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Curriculum = mongoose.model('Curriculum'),
	_ = require('lodash');

/**
 * Create a Curriculum
 */
exports.create = function(req, res) {
	var curriculum = new Curriculum(req.body);
	curriculum.user = req.user;

	curriculum.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(curriculum);
		}
	});
};

/**
 * Show the current Curriculum
 */
exports.read = function(req, res) {
	res.jsonp(req.curriculum);
};

/**
 * Update a Curriculum
 */
exports.update = function(req, res) {
	var curriculum = req.curriculum ;

	curriculum = _.extend(curriculum , req.body);

	curriculum.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(curriculum);
		}
	});
};

/**
 * Delete an Curriculum
 */
exports.delete = function(req, res) {
	var curriculum = req.curriculum ;

	curriculum.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(curriculum);
		}
	});
};

/**
 * List of Curriculums
 */
exports.list = function(req, res) { 
	Curriculum.find().sort('-created').populate('user', 'displayName').exec(function(err, curriculums) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(curriculums);
		}
	});
};

/**
 * Curriculum middleware
 */
exports.curriculumByID = function(req, res, next, id) { 
	Curriculum.findById(id).populate('user', 'displayName').exec(function(err, curriculum) {
		if (err) return next(err);
		if (! curriculum) return next(new Error('Failed to load Curriculum ' + id));
		req.curriculum = curriculum ;
		next();
	});
};

/**
 * Curriculum authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.curriculum.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
