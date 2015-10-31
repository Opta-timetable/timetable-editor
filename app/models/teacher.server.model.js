'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var TeacherSchema = new Schema({
  _id       : String,
  teacherID : String,
  specReference : String,
  code: String
});

mongoose.model('Teacher', TeacherSchema);

