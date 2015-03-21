'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    errorHandler = require('./errors.server.controller'),
    lecture = mongoose.model('Lecture'),
    curriculum = mongoose.model('Curriculum'),
    course = mongoose.model('Course'),
    _ = require('lodash');

/**
 * Show the current course
 */
exports.read = function (req, res) {
    res.json(req.course);
};


/**
 * Get all curriculums for work with timetable
 */
exports.list = function (req, res) {
    curriculum.find().sort('-created').exec(function (err, curriculums) {
        if (err) {
            return res.status(400).send({
                message : errorHandler.getErrorMessage(err)
            });
        } else {
            res.json(curriculums);
        }
    });
};

/**
 * Course middleware
 */
exports.timetableByCurriculumID = function (req, res, next, id) {
    //Associations now. Will have to live with this now
    console.log("called tt by curr");
    course.find({curriculumReference: id}, function(err, courses){
        if (err) {
            return res.status(400).send({
                message : errorHandler.getErrorMessage(err)
            });
        } else {
            lecture.find({_course: {$in: courses}}).populate('_course').populate('_period').exec(function(err, lectures){
                if (err) {
                    return res.status(400).send({
                        message : errorHandler.getErrorMessage(err)
                    });
                }else{
                    res.json(lectures);
                }
            });
        }
    });
};
