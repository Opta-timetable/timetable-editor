'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var TeacherSchema = new Schema({
  _id       : String,
  teacherID : String,
  code: {
    type: String,
    unique: true
  }
});

mongoose.model('Teacher', TeacherSchema);

