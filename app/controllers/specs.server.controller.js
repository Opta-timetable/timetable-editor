'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Spec = mongoose.model('Spec'),
	_ = require('lodash');

/**
 * Create a Spec
 */
exports.create = function(req, res) {
	var spec = new Spec(req.body);
	spec.user = req.user;

	spec.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(spec);
		}
	});
};

/**
 * Show the current Spec
 */
exports.read = function(req, res) {
	res.jsonp(req.spec);
};

/**
 * Update a Spec
 */
exports.update = function(req, res) {
	var spec = req.spec ;

	spec = _.extend(spec , req.body);

  console.log('spec to be saved is %j', spec);

	spec.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(spec);
		}
	});
};

/**
 * Delete an Spec
 */
exports.delete = function(req, res) {
	var spec = req.spec ;

	spec.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(spec);
		}
	});
};

/**
 * List of Specs
 */
exports.list = function(req, res) { 
	Spec.find().sort('-created').populate('user', 'displayName').exec(function(err, specs) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(specs);
		}
	});
};

/**
 * Spec middleware
 */
exports.specByID = function(req, res, next, id) { 
	Spec.findById(id).populate('user', 'displayName').exec(function(err, spec) {
		if (err) return next(err);
		if (! spec) return next(new Error('Failed to load Spec ' + id));
		req.spec = spec ;
		next();
	});
};

/**
 * Spec authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.spec.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};

/*
 * Utility function to create the unsolved XML format of the timetable
 * Note: Copied from optatimetablegenerator project for the CLI part
 */
var createHandler = function (ipFile, opFile) {
  //TODO Validations for CSV file
  var csv = require('csv-parser'),
    fs = require('fs'),
    unsolvedXML = require('./timetableXMLUtils');
  var theReadStream = fs.createReadStream(ipFile)
    .pipe(csv());
  theReadStream.on('data', function (data) {
    console.log('row', data);
    unsolvedXML.addRawData(data);
  });
  theReadStream.on('end', function () {
    console.log('Reached End of File');
    unsolvedXML.prepareXML(opFile);
  });

};
/*
 * Upload Spec file
 */
exports.uploadSpecFile = function(req, res){
  //console.dir(req.files);
  console.log(JSON.stringify(req.files));
  var specFileName = req.files.file.path,
    fileOriginalName = req.files.file.originalFilename;
  console.log('spec file is ' + specFileName);
  console.log('original file name is ' + fileOriginalName);
  console.log('converting CSV to Optaplanner InputXML');
  var outputFileName = specFileName.replace('csv', 'xml');
  console.log('output file name is ' + outputFileName);
  createHandler(specFileName, outputFileName);
  res.status(200).send({specFileName: specFileName,
    fileOriginalName: fileOriginalName,
    outputFileName: outputFileName,
    uploadState: 'Data ready for timetable generation'});
};

