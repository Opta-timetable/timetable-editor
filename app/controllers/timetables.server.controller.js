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
  Curriculum.find().sort('id').exec(function (err, curriculums) {
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
            var timetableForTeacher = new EmptyTimeTableDays();
            var allocationCount = 0;
            teacherAllocation.forEach(function (allocation) {
              var timetableCell = timetableForTeacher[parseInt(allocation.days.dayIndex)].periods[allocation.days.periods.index];
              allocationCount++;
              if (timetableCell.subject === ''){
                timetableCell.subject = allocation.days.periods.subject;
                timetableCell.curriculum = allocation.curriculumCode;
                timetableCell.clash = allocation.days.periods.clash;
              }else{
                //This would happen only in case of a clash
                timetableCell.clashInCurriculum = allocation.curriculumCode;
                timetableCell.clashInSubject = allocation.days.periods.subject;
              }
              //timetableForTeacher[parseInt(allocation.days.dayIndex)].periods[allocation.days.periods.index] = timetableCell;
              if (allocationCount === teacherAllocation.length) {
                res.json({teacherCode : teacher.code, teachersTimetable : timetableForTeacher});
              }
            });

          }

        });
    }
  });
};

exports.timetableByDayIndex = function (req, res) {
  var dayIndex = req.params.dayIndex;
  console.log('Searching timetables for Day' + dayIndex);
    Timetable.aggregate({$unwind : '$days'},
    {$match : {'days.dayIndex' : dayIndex}}, function (err, timetableForDay) {
      if (err) {
        console.log('error in aggregate');
        return res.status(400).send({
          message : errorHandler.getErrorMessage(err)
        });
      } else {
        console.log('timeTableForDay is %j', timetableForDay);
        res.json({timetableForDay: timetableForDay});
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

function modifyAPeriodAllocation(curriculum, dayToMatch, periodIndex, subject, teacher, clashToUpdate, onComplete){
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
        console.log('Set the new allocation details for db write');
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
        console.log('updating db for dayIndex %j, periodIndex %j', dayToMatch, periodIndex);
        console.log('timetable being updated is %j', newTimetableDays);
        return Timetable.update({curriculumReference : curriculum}, {$set : {days : newTimetableDays}}).exec();
      })
      .then(function (o) {
        console.log('timetable for current class updated');
        console.log('Clearing existing clashes if any');
        return new UnsetClashInOtherClassTimetable(clashToUpdate);
      })
      .then(null, function(err){
        if (err instanceof Error){
          onComplete(err);
        }
      })
      .then(function(){
        onComplete(null, clashesToSend); //callback
      });
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

  new modifyAPeriodAllocation(curriculum, dayToMatch, periodIndex, subject, teacher, clashToUpdate, function(err, clashesToSend){
    if (err instanceof Error) {
      console.log('Error during update' + errorHandler.getErrorMessage(err));
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
    }else{
      console.log('Timetable and Clashes updated successfully ');
      return res.status(200).send({clashIn : clashesToSend});
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

function ExtractClashFromList(period, clashesToUpdate){
  return clashesToUpdate.filter(function (clash) {
    return clash.days.dayIndex === period.dayIndex && clash.days.periods.index === period.periodIndex;
  })[0];
}

function ModifyTeacherInAllPeriodsForSubject(curriculum, periods, subjectCode, teacherCode, clashesToUpdate, onComplete){

  var newClashesDueToTeacherAssignment = [];
  var period = periods.pop();
  var clashToUpdate = new ExtractClashFromList(period, clashesToUpdate);
  console.log('Existing clash for period %j : %j', period, clashToUpdate);

  new modifyAPeriodAllocation(curriculum, period.dayIndex, period.periodIndex, subjectCode, teacherCode, clashToUpdate, function (err, newClashes){
    console.log('Existing clash for period %j : %j', period, clashToUpdate);
    if (err instanceof Error) {
      console.log('Error during update' + errorHandler.getErrorMessage(err));
      onComplete(err);
    }else{
      console.log('Timetable and Clashes updated successfully for one period');
      newClashesDueToTeacherAssignment.concat(newClashes);
      if (periods.length === 0){
        console.log('No more periods to modify. Teacher assignment complete. Returning...');
        onComplete(null, newClashesDueToTeacherAssignment);
      }else{
        console.log('More periods to modify');
        //recurse
        new ModifyTeacherInAllPeriodsForSubject(curriculum, periods, subjectCode, teacherCode, clashesToUpdate, onComplete);
      }
    }
  });
}
exports.changeTeacherAssignment = function (req, res) {

  var teacherReference = req.body.teacherReference,
    teacherCode = req.body.teacherCode,
    subjectCode = req.body.subjectCode,
    curriculum = req.body.curriculumReference,
    clashesToUpdate = req.body.clashesToUpdate;

  console.log('Received request with the following parameters teacherReference = %j, subjectCode = %j, curriculum = %j',
    teacherReference, subjectCode, curriculum);
  console.log('Clashes to update: %j', clashesToUpdate);
  //update the matching course in the courses collection
  Course.update({'curriculumReference' : curriculum,
    'code' : subjectCode}, {_teacher: teacherReference}).exec()
    .then(function(course){
      console.log('Updated course %j', course );
    })
    .then(function() {
      //Extract Timetable to update
      return Timetable.findOne({curriculumReference : curriculum}).exec();
    })
    .then(function(timetableToUpdate){
      //Extract the dayIndex and periodIndex(index) of the cells belonging to this subject
      var periodsToModify = [];
      for (var i=0;i<timetableToUpdate.days.length;i++){
        for (var j=0;j<timetableToUpdate.days[i].periods.length; j++){
          if (timetableToUpdate.days[i].periods[j].subject === subjectCode){
            periodsToModify.push({dayIndex: timetableToUpdate.days[i].dayIndex, periodIndex: j});
          }
        }
      }
      console.log('periods to modify: %j', periodsToModify);

      //We have the set of impacted periods, we will now do a modifyPeriodAllocation for the change of teacher for each period
      new ModifyTeacherInAllPeriodsForSubject(curriculum, periodsToModify, subjectCode, teacherCode, clashesToUpdate,
        function(err, newClashesDueToTeacherAssignment){
          if(err){
            return res.status(400).send({
              message : errorHandler.getErrorMessage(err)
            });
          }else{
            return res.status(200).send({clashIn : newClashesDueToTeacherAssignment});
          }

        });
    });
};
