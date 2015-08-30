'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  errorHandler = require('./errors.server.controller'),
  Teacher = mongoose.model('Teacher'),
  _ = require('lodash');

/**
 * Create a Teacher
 */
exports.create = function (req, res) {
  var teacher = new Teacher(req.body);
  teacher._id = mongoose.Types.ObjectId();
  console.log('variable teacher is %j', teacher);

  teacher.save(function (err) {
    if (err) {
      console.log('Hit an error while saving %j', err );
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(teacher);
    }
  });
};

/**
 * Show the current Teacher
 */
exports.read = function (req, res) {
  res.jsonp(req.teacher);
};

/**
 * Update a Teacher
 */
exports.update = function (req, res) {
  var teacher = req.teacher;

  teacher = _.extend(teacher, req.body);

  teacher.save(function (err) {
    if (err) {
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(teacher);
    }
  });
};

/**
 * Delete an Teacher
 */
exports.delete = function (req, res) {
  var teacher = req.teacher;

  teacher.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(teacher);
    }
  });
};

/**
 * List of Teachers
 */
exports.list = function (req, res) {
  console.log('finding teacher by specID ' + req.params.specId);
  Teacher.find({'specReference' : req.params.specId}).sort('code').exec(function (err, teachers) {
    if (err) {
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(teachers);
    }
  });
};

/**
 * Teacher middleware
 */
exports.teacherByID = function (req, res, next, id) {
  Teacher.findOne({'id' : req.params.id, 'specReference' : req.params.specId}).populate('user', 'displayName').exec(function (err, teacher) {
    if (err) return next(err);
    if (!teacher) return next(new Error('Failed to load Teacher ' + id));
    req.teacher = teacher;
    next();
  });
};

/**
 * Teacher authorization middleware
 */
exports.hasAuthorization = function (req, res, next) {
  if (req.teacher.user.id !== req.user.id) {
    return res.status(403).send('User is not authorized');
  }
  next();
};
