'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    errorHandler = require('./errors.server.controller'),
    lecture = mongoose.model('Lecture'),
    curriculum = mongoose.model('Curriculum'),
    course = mongoose.model('Course'),
    timetable = mongoose.model('Timetable'),
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
    course.find({curriculumReference: id}).populate('_teacher').exec(function(err, courses){
        if (err) {
            return res.status(400).send({
                message : errorHandler.getErrorMessage(err)
            });
        } else {
            timetable.findOne({curriculumReference : id}, function(err, timetable){
                if (err) {
                    return res.status(400).send({
                        message : errorHandler.getErrorMessage(err)
                    });
                }else{
                    console.log("Extracted timetable " + timetable);
                    res.json({courses: courses, timetable: timetable});
                }
            });
        }
    });
};
