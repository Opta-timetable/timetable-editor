'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var LectureSchema = new Schema({
  id                   : String,
  lectureID            : String,
  _course              : {type : Number, ref : 'Course'},
  locked               : String,
  lectureIndexInCourse : String,
  _period              : {type : String, ref : 'Period'},
  roomReference        : String,
  specReference        : String
});

mongoose.model('Lecture', LectureSchema);
