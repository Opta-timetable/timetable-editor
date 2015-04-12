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
exports.read = function (req, res, next, id) {
    req.id = id;
    next();
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
exports.timetableByCurriculumID = function (req, res) {
    //Associations now. Will have to live with this now
    course.find({curriculumReference: req.id}).populate('_teacher').exec(function(err, courses){
        if (err) {
            return res.status(400).send({
                message : errorHandler.getErrorMessage(err)
            });
        } else {
            timetable.findOne({curriculumReference : req.id}, function(err, timetable){
                if (err) {
                    return res.status(400).send({
                        message : errorHandler.getErrorMessage(err)
                    });
                }else{
                    console.log("Extracted timetable " + timetable);
                    //Surely an anti-pattern. This is not the purpose of app.param
                    res.json({courses: courses, timetable: timetable});
                }
            });
        }
    });
};

exports.validateDrop = function(req, res){
    console.log("period : " + JSON.stringify(req.body.currentPeriod));
    console.log("course : " + JSON.stringify(req.body.allocatedCourse));
    console.log("day : " + JSON.stringify(req.body.currentDay));

    //Look for course._teacher.code in the complete timetable and see if it matches any of the
    var dayToMatch = req.body.currentDay,
        periodIndex = req.body.currentPeriod.index,
        teacher = req.body.allocatedCourse._teacher.code;


    timetable.aggregate({$unwind: "$timetable"},{$unwind: "$timetable.periods"},
        {$match:{"timetable.dayIndex": dayToMatch}}, {$match:{"timetable.periods.index": parseInt(periodIndex)}},
        {$match:{"timetable.periods.teacher": teacher}}, function (err, o){
            if(err){
                return res.status(400).send({
                    message : errorHandler.getErrorMessage(err)
                });
            }else{
                console.log('output returned is ' + JSON.stringify(o));
                return res.status(200).send({clashIn : o});
            }
        });
};

exports.update = function(req, res){
    var timetableToUpdate = req.body.timetable.timetable;
    console.log("timetable to update : " + JSON.stringify(timetableToUpdate));
    timetable.update({curriculumReference: req.id}, {$set: {timetable: timetableToUpdate}}, function(err, o){
        if(err){
            return res.status(400).send({
                message : errorHandler.getErrorMessage(err)
            });
        }else{
            console.log('Update is successful ' + JSON.stringify(o));
            return res.status(200).send('OK');
        }
    });
};
