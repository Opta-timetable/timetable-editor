'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Subject Schema
 */
var SubjectSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Subject name',
		trim: true,
    unique: true
	},
  code: {
    type: String,
    default: '',
    required: 'Please fill Subject code',
    trim: true,
    unique: true
  },
	created: {
		type: Date,
		default: Date.now
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Subject', SubjectSchema);
