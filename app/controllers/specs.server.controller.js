'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
  fs = require('fs'),
  j2eeClient = require('./OptaplannerJ2EEClientUtils'),
  xmlUtils = require('./timetableXMLUtils'),
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
  var csv = require('csv-parser');
  var theReadStream = fs.createReadStream(ipFile)
    .pipe(csv());
  theReadStream.on('data', function (data) {
    console.log('row', data);
    xmlUtils.addRawData(data);
  });
  theReadStream.on('end', function () {
    console.log('Reached End of File');
    xmlUtils.prepareXML(opFile);
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

/*
 * Start Solving
 */
exports.solve = function(req, res){
  console.log('Req is ' + req.body.specID);
  var specId = req.body.specID;
  //Locate the upload XML file
  //{
  //	"user" : ObjectId("555ada432714f50a8759e19b"),
  //	"origFile" : "vidyo_unsolved_spec_raw.csv",
  //	"unsolvedXML" : "uploads/52483-ievh8z.xml",
  //	"state" : "Data ready for timetable generation",
  //	"_id" : ObjectId("5597e986e93a3203cdad854c"),
  //	"specFile" : "uploads/52483-ievh8z.csv",
  //	"created" : ISODate("2015-07-04T14:11:18.425Z"),
  //	"name" : "Vidyodaya-2014-1",
  //	"__v" : 0
  //}
  Spec.findById(specId).exec(function(err, spec) {
 		if (err) return err;
 		if (! spec) return (new Error('Failed to load Spec ' + specId));
 		console.log('Spec for this operation is %j', spec);
 	}).then(function(spec) {
    //Got the record, take the spec file and upload it to Optaplanner J2EE Server
    var unsolvedXMLFilePath = './' + spec.unsolvedXML;
    var splitPath = unsolvedXMLFilePath.split('/');
    var unsolvedXMLFileName = splitPath[splitPath.length - 1]; //name will be last
    console.log('unsolvedXML file name is ' + unsolvedXMLFileName);
    console.log('unsolvedXML file is in path %j', unsolvedXMLFilePath);

    //Using callbacks for now
    j2eeClient.uploadUnsolvedFile(unsolvedXMLFilePath, unsolvedXMLFileName, function(){
      j2eeClient.initializeSolver(function(){
        j2eeClient.startSolver(function(){
          res.status(200).send();
        });
      });
    });
  });
};

/*
 * Is a solution in progress
 */
exports.isSolving = function(req, res){
  j2eeClient.isSolving(function(status){
    res.status(200).send(status);
  });
};

/*
 * Terminate current solving
 */
exports.terminateSolving = function(req, res) {
  j2eeClient.terminateSolving(function() {
    res.status(200).send();
  });
};

/*
 * Get Current Solution Score
 */
exports.currentSolutionScore = function(req, res) {
  j2eeClient.currentSolutionScore(function(status) {
    res.status(200).send(status);
  });
};

/*
 * Get the solved XML file
 */
exports.getSolvedXML = function(req, res){
  console.log('Req is ' + req.body.specID);
    var specId = req.body.specID;
    Spec.findById(specId).exec(function(err, spec) {
   		if (err) return err;
   		if (!spec) return (new Error('Failed to load Spec ' + specId));
   		console.log('Spec for this operation is %j', spec);
   	}).then(function(spec) {
      var splitPath = spec.unsolvedXML.split('/'); //Unsolved and solved XMLs have the same name
      var solvedXMLFileName = splitPath[splitPath.length - 1];
      var solvedXMLPath = './solved/'+ solvedXMLFileName;
      j2eeClient.getSolvedXML(solvedXMLPath, function() {
        xmlUtils.solvedXMLParser(specId, solvedXMLPath, function () {
          Spec.update({'_id' : specId}, {$set : {'state' : 'Timetable Generated and Available for use'}}, function(){
            res.status(200).send({'uploadState' : 'Timetable Generated and Available for use' });
          });
        });
      });
    });
};
