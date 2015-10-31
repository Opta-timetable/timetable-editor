'use strict';

var mongoose = require('mongoose');

var periodSchema = mongoose.Schema({'index' : Number, 'subject' : String, 'teacher' : String, 'clash' : Boolean});

var daySchema = mongoose.Schema({
  'dayOfWeek' : String,
  'dayIndex'  : String,
  'periods'   : [periodSchema]
});

var timetableSchema = mongoose.Schema({
  curriculumReference : String,
  curriculumCode      : String,
  specReference       : String,
  days                : [daySchema]
});
var Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;
