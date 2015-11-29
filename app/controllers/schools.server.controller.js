'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	School = mongoose.model('School'),
	_ = require('lodash');

/**
 * Create a School
 */
exports.create = function(req, res) {
	var school = new School(req.body);
	school.user = req.user;

	school.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(school);
		}
	});
};

/**
 * Show the current School
 */
exports.read = function(req, res) {
	res.jsonp(req.school);
};

/**
 * Update a School
 */
exports.update = function(req, res) {
	var school = req.school ;

	school = _.extend(school , req.body);

	school.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(school);
		}
	});
};

/**
 * Delete an School
 */
exports.delete = function(req, res) {
	var school = req.school ;

	school.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(school);
		}
	});
};

/**
 * List of Schools
 */
exports.list = function(req, res) { 
	School.find().sort('-created').populate('user', 'displayName').exec(function(err, schools) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(schools);
		}
	});
};

/**
 * School middleware
 */
exports.schoolByID = function(req, res, next, id) { 
	School.findById(id).populate('user', 'displayName').exec(function(err, school) {
		if (err) return next(err);
		if (! school) return next(new Error('Failed to load School ' + id));
		req.school = school ;
		next();
	});
};

/**
 * School authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.school.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
