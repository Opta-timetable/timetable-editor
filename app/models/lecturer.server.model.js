'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

//A teacher assigned to a lecture in a specification is a Lecturer.
//This collection gets populated by the XML Solution Parser and not via Entity Management
//The global entity that can be assigned across specifications for a school is 'Teacher'
var LecturerSchema = new Schema({
  _id       : String,
  teacherID : String,
  specReference : String,
  code: String
});

mongoose.model('Lecturer', LecturerSchema);


