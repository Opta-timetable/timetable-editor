'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Subject = mongoose.model('Subject'),
	_ = require('lodash');

/**
 * Create a Subject
 */
exports.create = function(req, res) {
	var subject = new Subject(req.body);
	subject.user = req.user;

	subject.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(subject);
		}
	});
};

/**
 * Show the current Subject
 */
exports.read = function(req, res) {
	res.jsonp(req.subject);
};

/**
 * Update a Subject
 */
exports.update = function(req, res) {
	var subject = req.subject ;

	subject = _.extend(subject , req.body);

	subject.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(subject);
		}
	});
};

/**
 * Delete an Subject
 */
exports.delete = function(req, res) {
	var subject = req.subject ;

	subject.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(subject);
		}
	});
};

/**
 * List of Subjects
 */
exports.list = function(req, res) { 
	Subject.find().sort('-created').populate('user', 'displayName').exec(function(err, subjects) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(subjects);
		}
	});
};

/**
 * Subject middleware
 */
exports.subjectByID = function(req, res, next, id) { 
	Subject.findById(id).populate('user', 'displayName').exec(function(err, subject) {
		if (err) return next(err);
		if (! subject) return next(new Error('Failed to load Subject ' + id));
		req.subject = subject ;
		next();
	});
};

/**
 * Subject authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.subject.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
