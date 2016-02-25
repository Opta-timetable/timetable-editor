'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var AssignmentSchema = new Schema({
  section: String,
  subjectCode: String,
  teacherCode: String,
  numberOfClassesInAWeek: Number
});

/**
 * Spec Schema
 * TODO Remove file related stuff
 */
var SpecSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Spec name',
		trim: true,
    unique: true
	},
  numberOfWorkingDaysInAWeek: {
    type: Number,
    default: 5
  },
  numberOfPeriodsInADay: {
    type: Number,
    default: 8
  },
	created: {
		type: Date,
		default: Date.now
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	},
  specFile: {
    type: String,
    default: '',
    trim: true
  },
  origFile: String,
  unsolvedXML: String,
  sections: [String],
  assignments: [AssignmentSchema],
  state: String
});

mongoose.model('Assignment', AssignmentSchema);
mongoose.model('Spec', SpecSchema);
