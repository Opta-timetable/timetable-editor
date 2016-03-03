'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Section Schema
 */
var SectionSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Class name - For example: X-A',
		trim: true
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

mongoose.model('Section', SectionSchema);
