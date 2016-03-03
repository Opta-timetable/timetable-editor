'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var TeacherSchema = new Schema({
  _id       : String,
  firstName : String,
  lastName : String,
  email : String,
  details : String,
  code: String,
  created: {
  	type: Date,
    default: Date.now
  },
  user: {
  	type: Schema.ObjectId,
  	ref: 'User'
  }
});

mongoose.model('Teacher', TeacherSchema);

