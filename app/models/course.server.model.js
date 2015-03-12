'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var CourseSchema = new Schema({
  _id                 : Number,
  courseID            : String,
  code                : String,
  teacherID           : String,
  lectureSize         : String,
  minWorkingDaySize   : String,
  curriculumReference : String,
  studentSize         : String,
  _teacher            : {type : Number, ref : 'Teacher'}
});

mongoose.model('Course', CourseSchema);
