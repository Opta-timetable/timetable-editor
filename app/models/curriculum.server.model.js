'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var CurriculumSchema = new Schema({
  id           : String,
  curriculumID : String,
  code         : String
});

mongoose.model('Curriculum', CurriculumSchema);
