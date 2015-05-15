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

exports.timetableByCurriculum = function (req, res) {
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

function SetClashInOtherClassTimetable(clashes) {
  if (clashes.length > 0) {
    var clashesUpdateTracker = clashes.length;
    clashes.forEach(function (clash) {
      Timetable.findOne({curriculumReference : clash.curriculumReference}).exec()
        .then(function (timetableToUpdate) {
          console.log('Found clash to set');
          timetableToUpdate.days[parseInt(clash.days.dayIndex)].periods[clash.days.periods.index].clash = true;
          return Timetable.update({curriculumReference : clash.curriculumReference},
            {$set : {days : timetableToUpdate.days}}).exec();
        }).then(null, function (err) {
          if (err instanceof Error) {
            console.log('Error while updating new clashes');
            throw err;
          }
        })
        .then(function () {
          console.log('One Clash updated successfully');
          clashesUpdateTracker--;
          if (clashesUpdateTracker === 0) {
            console.log('All Clashes set successfully');
          }
        });
    });
  } else {
    console.log('no new clashes to set');
  }
}

function UnsetClashInOtherClassTimetable(clash) {
//new clashes updated. Clear old clash if any
  if (JSON.stringify(clash) !== '{}') {
    console.log('Entered Clash to clear:  %j', clash);
    Timetable.findOne({curriculumReference : clash.curriculumReference}).exec()
      .then(function (timetable) {
        console.log('timetableToClearClash: %j', timetable);
        console.log('Found clash to clear');
        timetable.days[parseInt(clash.days.dayIndex)].
          periods[clash.days.periods.index].clash = false;
        Timetable.update({curriculumReference : clash.curriculumReference},
          {$set : {days : timetable.days}}).exec().then(null, function (err) {
            if (err instanceof Error) {
              console.log('Error while clearing clash');
              throw err;
            }
          });
      })
      .then(function () {
        console.log('clash cleared successfully');
      });
  } else {
    console.log('No clashes to clear');
  }
}

exports.modifyPeriodAllocation = function (req, res) {
  //Coordinates for the allocation
  var dayToMatch = req.body.currentDay,
    periodIndex = req.body.currentPeriod.index,
    curriculum = req.body.allocatedCourse.curriculumReference,
  //Details for the new Allocation
    subject = req.body.allocatedCourse.code,
    teacher = req.body.allocatedCourse._teacher.code,

  //Clash because of the current allocation aka 'Existing Clash'
    clashToUpdate = req.body.clashToUpdate;

  console.log('Modifying allocation for Class %j on day %j, periodIndex %j with subject %j and teacher %j ',
    curriculum, dayToMatch, periodIndex, subject, teacher);
  console.log('Clash due to existing allocation ' + JSON.stringify(clashToUpdate));

  var newTimetableDays, currentPeriod, clashesToSend;

  //Extract the timetable document to update
  Timetable.findOne({curriculumReference : curriculum}).exec()
    .then(function (timetableToUpdate) {
      console.log('Found timetable to update');
      newTimetableDays = timetableToUpdate.days;
      currentPeriod = newTimetableDays[parseInt(dayToMatch)].periods[periodIndex];
      currentPeriod.subject = subject;
      currentPeriod.teacher = teacher;
      currentPeriod.clash = false; //Clear old clash
      //Are there are any new clashes?
      return Timetable.aggregate({$unwind : '$days'}, {$unwind : '$days.periods'},
        {$match : {'days.dayIndex' : dayToMatch}},
        {$match : {'days.periods.index' : parseInt(periodIndex)}},
        {$match : {'days.periods.teacher' : teacher}},
        {$match : {'days.periods.teacher' : {$ne : ''}}},
        {$match : {'curriculumReference' : {$ne : curriculum}}}).exec();
    })
    .then(function (clashes) {
      clashesToSend = clashes;
      console.log('clashes output returned is ' + JSON.stringify(clashes));
      if (clashes.length > 0) {
        currentPeriod.clash = true;
      }
      return new SetClashInOtherClassTimetable(clashes);
    })
    .then(function () {
      //Clash due to new allocation is discovered and updated in the 'other' class
      //Now update the new allocation into this class's timetable
      return Timetable.update({curriculumReference : curriculum}, {$set : {days : newTimetableDays}}).exec();
    })
    .then(function (o) {
      console.log('timetable for current class updated');
      console.log('Clearing existing clashes if any');
      return new UnsetClashInOtherClassTimetable(clashToUpdate);
    })
    .then(null, function (err) {
      if (err instanceof Error) {
        console.log('Error during update' + errorHandler.getErrorMessage(err));
        return res.status(400).send({
          message : errorHandler.getErrorMessage(err)
        });
      }
    })
    .then(function () {
      console.log('Timetable and Clashes updated successfully ');
      return res.status(200).send({clashIn : clashesToSend});
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
  console.log('Teacher code is ' + teacherCode);
  Timetable.aggregate({$unwind : '$days'}, {$unwind : '$days.periods'},
    {$match : {'days.periods.teacher' : teacherCode}}, function (err, periodsForTeacher) {
      if (err) {
        console.log('error in aggregate');
        return res.status(400).send({
          message : errorHandler.getErrorMessage(err)
        });
      } else {
        //console.log('periodsForTeacher returned is ' + JSON.stringify(periodsForTeacher));
        return res.status(200).send({teacherStats : {totalAllocation : periodsForTeacher.length}});
      }
    });
};
