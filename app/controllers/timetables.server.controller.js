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
                    console.log('Extracted timetable ' + timetable);
                    res.json({courses: courses, timetable: timetable});
                }
            });
        }
    });
};

exports.performDrop = function(req, res){
    console.log('period : ' + JSON.stringify(req.body.currentPeriod));
    console.log('course : ' + JSON.stringify(req.body.allocatedCourse));
    console.log('day : ' + JSON.stringify(req.body.currentDay));
    console.log('curriculum : ' + JSON.stringify(req.body.allocatedCourse.curriculumReference));
    //Look for course._teacher.code in the complete timetable and see if it matches any of the
    var dayToMatch = req.body.currentDay,
        periodIndex = req.body.currentPeriod.index,
        teacher = req.body.allocatedCourse._teacher.code,
        curriculum = req.body.allocatedCourse.curriculumReference,
        subject = req.body.allocatedCourse.code,
        clashToUpdate = req.body.clashToUpdate;

    console.log('clashToUpdate ' + JSON.stringify(clashToUpdate));

    //Extract the timetable document to update
    timetable.findOne({curriculumReference : curriculum}, function(err, timetableToUpdate){
        if (err){
            return res.status(400).send({
                message : errorHandler.getErrorMessage(err)
            });
        }else{
            var newTimetable = timetableToUpdate.timetable;
            newTimetable[parseInt(dayToMatch)].periods[periodIndex].subject = subject;
            newTimetable[parseInt(dayToMatch)].periods[periodIndex].teacher = teacher;
            newTimetable[parseInt(dayToMatch)].periods[periodIndex].clash = false;

            console.log('Updated timetable is: ' + JSON.stringify(newTimetable));
            //Look for clashes
            timetable.aggregate({$unwind: '$timetable'},{$unwind: '$timetable.periods'},
                {$match:{'timetable.dayIndex': dayToMatch}},
                {$match:{'timetable.periods.index': parseInt(periodIndex)}},
                {$match:{'timetable.periods.teacher': teacher}},
                {$match:{'curriculumReference':{ $ne: curriculum}}}, function (err, clashes){
                    if(err){
                        console.log('error in aggregate');
                        return res.status(400).send({
                            message : errorHandler.getErrorMessage(err)
                        });
                    }else{
                        console.log('output returned is ' + JSON.stringify(clashes));
                        if (clashes.length > 0){
                            newTimetable[parseInt(dayToMatch)].periods[periodIndex].clash = true;
                        }
                        //update timetable document
                        timetable.update({curriculumReference : curriculum}, {$set: {timetable: newTimetable}}, function(err, o){
                            if(err){
                                return res.status(400).send({
                                    message : errorHandler.getErrorMessage(err)
                                });
                            }else{
                                console.log('Update is successful ' + JSON.stringify(o));
                                if (clashes.length > 0){
                                    var clashesUpdateTracker = clashes.length;
                                    clashes.forEach(function(clash){
                                        timetable.findOne({curriculumReference: clash.curriculumReference},
                                            function(err, timetableToUpdateForClash){
                                                timetableToUpdateForClash.timetable[parseInt(dayToMatch)].periods[periodIndex].clash = true;
                                                timetable.update({curriculumReference: clash.curriculumReference},
                                                    {$set:{timetable: timetableToUpdateForClash.timetable}}, function(err, o){
                                                        clashesUpdateTracker--;
                                                        if (clashesUpdateTracker === 0){
                                                            //new clashes updated. Clear old clash if any
                                                            if (JSON.stringify(clashToUpdate) !== '{}'){
                                                                console.log("Entered Clash to update");
                                                                timetable.findOne({curriculumReference: clashToUpdate.curriculumReference},
                                                                    function(err, timetableToClearClash) {
                                                                        if (err){
                                                                            console.log('error while finding existing clash');
                                                                            return res.status(400).send({
                                                                                message : errorHandler.getErrorMessage(err)
                                                                            });
                                                                        }else{
                                                                            console.log("Found clash to update");
                                                                            timetableToClearClash.timetable[parseInt(clashToUpdate.timetable.dayIndex)].
                                                                                periods[clashToUpdate.timetable.periods.index].clash = false;
                                                                            timetable.update({curriculumReference: clashToUpdate.curriculumReference},
                                                                                {$set: {timetable: timetableToClearClash.timetable}}, function (err, o) {
                                                                                    if(err){
                                                                                        return res.status(400).send({
                                                                                            message : errorHandler.getErrorMessage(err)
                                                                                        });
                                                                                    }else{
                                                                                        return res.status(200).send({clashIn : clashes});
                                                                                    }
                                                                                });
                                                                        }
                                                                    });
                                                            }else{
                                                                return res.status(200).send({clashIn : clashes});
                                                            }


                                                        }
                                                    });
                                            });
                                    });
                                }else{
                                    if (JSON.stringify(clashToUpdate) !== '{}'){
                                        console.log("Entered Clash to update");
                                        timetable.findOne({curriculumReference: clashToUpdate.curriculumReference},
                                            function(err, timetableToClearClash) {
                                                if (err){
                                                    console.log('error while finding existing clash');
                                                    return res.status(400).send({
                                                        message : errorHandler.getErrorMessage(err)
                                                    });
                                                }else{
                                                    console.log("Found clash to update");
                                                    timetableToClearClash.timetable[parseInt(clashToUpdate.timetable.dayIndex)].
                                                        periods[clashToUpdate.timetable.periods.index].clash = false;
                                                    timetable.update({curriculumReference: clashToUpdate.curriculumReference},
                                                        {$set: {timetable: timetableToClearClash.timetable}}, function (err, o) {
                                                            if(err){
                                                                return res.status(400).send({
                                                                    message : errorHandler.getErrorMessage(err)
                                                                });
                                                            }else{
                                                                return res.status(200).send({clashIn : clashes});
                                                            }
                                                        });
                                                }
                                            });
                                    }else{
                                        return res.status(200).send({clashIn : clashes});
                                    }
                                }
                            }
                        });
                    }
                });

        }

    });
};

exports.update = function(req, res){
    var timetableToUpdate = req.body.timetable.timetable;
    console.log('timetable to update : ' + JSON.stringify(timetableToUpdate));
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

exports.discoverClashes = function(req, res){
    var dayToMatch = req.body.currentDay,
        period = req.body.currentPeriod,
        curriculum = req.body.curriculumId;

    timetable.aggregate({$unwind: '$timetable'},{$unwind: '$timetable.periods'},
        {$match:{'timetable.dayIndex': dayToMatch}},
        {$match:{'timetable.periods.index': period.index}},
        {$match:{'timetable.periods.teacher': period.teacher}},
        {$match:{'curriculumReference':{ $ne: curriculum}}}, function (err, clashes) {
            if (err) {
                console.log('error in aggregate');
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                console.log('output returned is ' + JSON.stringify(clashes));
                return res.status(200).send({clashIn : clashes});
            }
        });
};
