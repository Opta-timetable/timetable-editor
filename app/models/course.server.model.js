'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var CourseSchema = new Schema({
  id                 : String,
  courseID            : String,
  code                : String,
  teacherID           : String,
  lectureSize         : String,
  minWorkingDaySize   : String,
  curriculumReference : String,
  studentSize         : String,
  specReference       : String,
  _teacher            : {type : String, ref : 'Teacher'}
});

mongoose.model('Course', CourseSchema);
