'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  errorHandler = require('./errors.server.controller'),
// Mongoose models should always be named with Capital case,
// so that they're easily distinguished from instances of themselves
  Lecture = mongoose.model('Lecture'),
  Curriculum = mongoose.model('Curriculum'),
  Course = mongoose.model('Course'),
  Timetable = mongoose.model('Timetable'),
  Teacher = mongoose.model('Teacher'),
  _ = require('lodash');

//For use by TimetableByTeacher
//The timetable stored in the db won't do for this purpose. Initialising a placeholder
var EmptyTimeTableDays = function () {

  // new Array() is not recommended because of the ambiguity in the two types of parameters it takes
  // read more here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
  // var timeTableData = new Array();
  var timeTableData = [];
  var dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  //Initialise - Assuming hardcoded metadata (number of days, number of periods)
  for (var i = 0; i < dayName.length; i++) {
    var allocationsForDayOfWeek = {};
    allocationsForDayOfWeek.dayOfWeek = dayName[i];
    allocationsForDayOfWeek.dayIndex = i;
    allocationsForDayOfWeek.periods = [];
    for (var k = 0; k < 7; k++) {
      var period = {};
      period.index = k;
      period.subject = '';
      period.curriculum = '';
      period.clash = false;
      allocationsForDayOfWeek.periods.push(period);
    }
    timeTableData.push(allocationsForDayOfWeek);
  }
  return timeTableData;
};

// TODO: Remnants of a copy-paste ?
exports.read = function (req, res, next, id) {
  req.id = id;
  next();
};

/**
 * Get all curriculums for work with timetable
 */
exports.list = function (req, res) {
  Curriculum.find().sort('-created').exec(function (err, curriculums) {
    if (err) {
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(curriculums);
    }
  });
};

exports.timetableByCurriculumID = function (req, res) {
  //Associations now. Will have to live with this now
  Course.find({curriculumReference : req.id}).populate('_teacher').exec(function (err, courses) {
    if (err) {
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
    } else {
      Timetable.findOne({curriculumReference : req.id}, function (err, timetable) {
        if (err) {
          return res.status(400).send({
            message : errorHandler.getErrorMessage(err)
          });
        } else {
          console.log('Extracted timetable ' + timetable);
          res.json({courses : courses, timetable : timetable});
        }
      });
    }
  });
};

exports.timetableByTeacherID = function (req, res) {
  console.log('Searching for ' + req.params._id);
  Teacher.findOne({_id : req.params._id}).exec(function (err, teacher) {
    if (err) {
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
    } else {
      console.log('Teacher requested is ' + JSON.stringify(teacher));
      Timetable.aggregate({$unwind : '$days'}, {$unwind : '$days.periods'},
        {$match : {'days.periods.teacher' : teacher.code}}, function (err, teacherAllocation) {
          if (err) {
            console.log('error in aggregate');
            return res.status(400).send({
              message : errorHandler.getErrorMessage(err)
            });
          } else {
            console.log('teacherAllocation is %j', teacherAllocation);
            var timetableForTeacher = new EmptyTimeTableDays();
            console.log('empty timetableForTeacher = %j', timetableForTeacher);
            var allocationCount = 0;
            teacherAllocation.forEach(function (allocation) {
              allocationCount++;
              timetableForTeacher[parseInt(allocation.days.dayIndex)].periods[allocation.days.periods.index].subject =
                allocation.days.periods.subject;
              timetableForTeacher[parseInt(allocation.days.dayIndex)].periods[allocation.days.periods.index].curriculum =
                allocation.curriculumCode;
              if (allocationCount === teacherAllocation.length) {
                res.json({teacherCode : teacher.code, teachersTimetable : timetableForTeacher});
              }
            });

          }

        });
    }
  });
};

exports.modifyPeriodAllocation = function (req, res) {
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
  Timetable.findOne({curriculumReference : curriculum}, function (err, timetableToUpdate) {
    if (err) {
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
    } else {
      var newTimetableDays = timetableToUpdate.days;
      var currentPeriod = newTimetableDays[parseInt(dayToMatch)].periods[periodIndex];
      currentPeriod.subject = subject;
      currentPeriod.teacher = teacher;
      currentPeriod.clash = false;

      // console.log('Updated timetable is: ' + JSON.stringify(newTimetableDays));
      //Look for clashes
      Timetable.aggregate({$unwind : '$days'}, {$unwind : '$days.periods'},
        {$match : {'days.dayIndex' : dayToMatch}},
        {$match : {'days.periods.index' : parseInt(periodIndex)}},
        {$match : {'days.periods.teacher' : teacher}},
        {$match : {'days.periods.teacher' : {$ne : ''}}},
        {$match : {'curriculumReference' : {$ne : curriculum}}}, function (err, clashes) {
          if (err) {
            console.log('error in aggregate');
            return res.status(400).send({
              message : errorHandler.getErrorMessage(err)
            });
          } else {
            console.log('output returned is ' + JSON.stringify(clashes));
            if (clashes.length > 0) {
              newTimetableDays[parseInt(dayToMatch)].periods[periodIndex].clash = true;
            }
            //update timetable document with the updated days array
            Timetable.update({curriculumReference : curriculum}, {$set : {days : newTimetableDays}}, function (err, o) {
              if (err) {
                return res.status(400).send({
                  message : errorHandler.getErrorMessage(err)
                });
              } else {
                console.log('Update is successful ' + JSON.stringify(o));
                if (clashes.length > 0) {
                  var clashesUpdateTracker = clashes.length;
                  clashes.forEach(function (clash) {
                    Timetable.findOne({curriculumReference : clash.curriculumReference},
                      function (err, timetableToUpdateForClash) {
                        timetableToUpdateForClash.days[parseInt(dayToMatch)].periods[periodIndex].clash = true;
                        Timetable.update({curriculumReference : clash.curriculumReference},
                          {$set : {days : timetableToUpdateForClash.days}}, function (err, o) {
                            clashesUpdateTracker--;
                            if (clashesUpdateTracker === 0) {
                              //new clashes updated. Clear old clash if any
                              if (JSON.stringify(clashToUpdate) !== '{}') {
                                console.log('Entered Clash to update:  %j', clashToUpdate);
                                Timetable.findOne({curriculumReference : clashToUpdate.curriculumReference},
                                  function (err, timetableToClearClash) {
                                    console.log('timetableToClearClash: %j', timetableToClearClash);
                                    if (err) {
                                      console.log('error while finding existing clash');
                                      return res.status(400).send({
                                        message : errorHandler.getErrorMessage(err)
                                      });
                                    } else {
                                      console.log('Found clash to update');
                                      timetableToClearClash.days[parseInt(clashToUpdate.days.dayIndex)].
                                        periods[clashToUpdate.days.periods.index].clash = false;
                                      Timetable.update({curriculumReference : clashToUpdate.curriculumReference},
                                        {$set : {days : timetableToClearClash.days}}, function (err, o) {
                                          if (err) {
                                            return res.status(400).send({
                                              message : errorHandler.getErrorMessage(err)
                                            });
                                          } else {
                                            return res.status(200).send({clashIn : clashes});
                                          }
                                        });
                                    }
                                  });
                              } else {
                                return res.status(200).send({clashIn : clashes});
                              }


                            }
                          });
                      });
                  });
                } else {
                  if (JSON.stringify(clashToUpdate) !== '{}') {
                    console.log('Entered Clash to update %j', clashToUpdate);
                    Timetable.findOne({curriculumReference : clashToUpdate.curriculumReference},
                      function (err, timetableToClearClash) {
                        console.log('timetableToClearClash: %j', timetableToClearClash);
                        if (err) {
                          console.log('error while finding existing clash');
                          return res.status(400).send({
                            message : errorHandler.getErrorMessage(err)
                          });
                        } else {
                          console.log('Found clash to update');
                          timetableToClearClash.days[parseInt(clashToUpdate.days.dayIndex)].
                            periods[clashToUpdate.days.periods.index].clash = false;
                          Timetable.update({curriculumReference : clashToUpdate.curriculumReference},
                            {$set : {days : timetableToClearClash.days}}, function (err, o) {
                              if (err) {
                                return res.status(400).send({
                                  message : errorHandler.getErrorMessage(err)
                                });
                              } else {
                                return res.status(200).send({clashIn : clashes});
                              }
                            });
                        }
                      });
                  } else {
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

exports.update = function (req, res) {
  var timetableToUpdate = req.body.timetable.days;
  console.log('timetable to update : ' + JSON.stringify(timetableToUpdate));
  Timetable.update({curriculumReference : req.id}, {$set : {days : timetableToUpdate}}, function (err, o) {
    if (err) {
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
    } else {
      console.log('Update is successful ' + JSON.stringify(o));
      return res.status(200).send('OK');
    }
  });
};

exports.discoverClashes = function (req, res) {
  var dayToMatch = req.body.currentDay,
    period = req.body.currentPeriod,
    curriculum = req.body.curriculumId;

  Timetable.aggregate({$unwind : '$days'}, {$unwind : '$days.periods'},
    {$match : {'days.dayIndex' : dayToMatch}},
    {$match : {'days.periods.index' : period.index}},
    {$match : {'days.periods.teacher' : period.teacher}},
    {$match : {'curriculumReference' : {$ne : curriculum}}}, function (err, clashes) {
      if (err) {
        console.log('error in aggregate');
        return res.status(400).send({
          message : errorHandler.getErrorMessage(err)
        });
      } else {
        console.log('output returned is ' + JSON.stringify(clashes));
        return res.status(200).send({clashIn : clashes});
      }
    });
};

exports.collectStats = function (req, res) {
    var teacherCode = req.body.teacherCode;
    console.log("Teacher code is " + teacherCode);
    Timetable.aggregate({$unwind : '$days'}, {$unwind : '$days.periods'},
        {$match : {'days.periods.teacher' : teacherCode}}, function (err, periodsForTeacher) {
            if (err) {
                console.log('error in aggregate');
                return res.status(400).send({
                    message : errorHandler.getErrorMessage(err)
                });
            } else {
                console.log('periodsForTeacher returned is ' + JSON.stringify(periodsForTeacher));
                return res.status(200).send({teacherStats : {totalAllocation : periodsForTeacher.length}});
            }
        });
};
