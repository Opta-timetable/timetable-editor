'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PeriodSchema = new Schema({
  _id           : String,
  periodID      : String,
  timeslotIndex : String,
  dayIndex      : String,
  specReference : String
});

mongoose.model('Period', PeriodSchema);
