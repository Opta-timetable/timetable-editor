'use strict';

var mongoose = require('mongoose');

var periodSchema = mongoose.Schema({"index" : Number, "subject" : String, "teacher" : String});

var daySchema = mongoose.Schema({
    "dayOfWeek" : String,
    "dayIndex" : String,
    "periods" : [periodSchema]
});

var timetableSchema = mongoose.Schema({
    curriculumReference : String,
    curriculumCode      : String,
    timetable           : [daySchema]
});
var Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;