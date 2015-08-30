'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  errorHandler = require('./errors.server.controller'),
  Course = mongoose.model('Course'),
  _ = require('lodash');

/**
 * Create a course
 */
exports.create = function (req, res) {
  var course = new Course(req.body);
  course.user = req.user;

  course.save(function (err) {
    if (err) {
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(course);
    }
  });
};

/**
 * Show the current course
 */
exports.read = function (req, res) {
  res.json(req.course);
};

/**
 * Update a course
 */
exports.update = function (req, res) {
  var course = req.course;

  course = _.extend(course, req.body);

  course.save(function (err) {
    if (err) {
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(course);
    }
  });
};

/**
 * Delete an course
 */
exports.delete = function (req, res) {
  var course = req.course;

  course.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(course);
    }
  });
};

/**
 * List of Courses
 */
exports.list = function (req, res) {
  Course.find().sort('-created').populate('_teacher').exec(function (err, courses) {
    if (err) {
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(courses);
    }
  });
};

/**
 * Course middleware
 */
exports.courseByID = function (req, res, next, id) {
  Course.find({id : id}).populate('_teacher').exec(function (err, course) {
    if (err) return next(err);
    if (!course) return next(new Error('Failed to load course ' + id));
    req.course = course;
    next();
  });
};

/**
 * Course authorization middleware
 */
exports.hasAuthorization = function (req, res, next) {
  if (req.course.user.id !== req.user.id) {
    return res.status(403).send({
      message : 'User is not authorized'
    });
  }
  next();
};
