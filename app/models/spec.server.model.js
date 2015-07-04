'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Spec Schema
 */
var SpecSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Spec name',
		trim: true
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
    required: 'Please upload your Spec File',
    trim: true
  },
  origFile: String,
  unsolvedXML: String,
  state: String
});

mongoose.model('Spec', SpecSchema);
