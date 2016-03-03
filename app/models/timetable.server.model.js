'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

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
  days                : [daySchema],
  created: {
  	type: Date,
  	default: Date.now
  },
  user: {
  	type: Schema.ObjectId,
  	ref: 'User'
  }
});
var Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;
