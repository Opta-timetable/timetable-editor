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
  Assignment = mongoose.model('Assignment'),
  Teacher = mongoose.model('Teacher'),
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
  xmlUtils.clearRawData();
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
 * Upload Spec file - Used if CSV is uploaded by user
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
 * Generate Spec File from assignments in spec
 */
exports.generateSpecFile = function(req, res){
  var specId = req.params.specId;
  Spec.findById(specId, function(err, spec){
    if (err) {
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
    } else {
      var assignments = spec.assignments;
      var ipfile = './uploads/' + specId + '.csv';
      var fs = require('fs');
      var stream = fs.createWriteStream(ipfile);
      stream.once('open', function(fd) {
        stream.write('Class,Subject,Teacher,PeriodsInAWeek\n');
        for (var i=0; i<assignments.length; i++){
          stream.write(assignments[i].section + ',' +
            assignments[i].subjectCode + ',' +
            assignments[i].teacherCode + ',' +
            assignments[i].numberOfClassesInAWeek + '\n');
        }
        stream.end();
        console.log('spec file is ' + ipfile);
        console.log('original file name is ' + 'Not Applicable');
        console.log('converting CSV to Optaplanner InputXML');
        var outputFileName = ipfile.replace('csv', 'xml');
        console.log('output file name is ' + outputFileName);
        createHandler(ipfile, outputFileName);
        //Update the spec with the new values
        spec.origFile = 'Not Applicable';
        spec.origFile = 'Not Applicable';
        spec.state = 'Data ready for timetable generation';
        spec.unsolvedXML = outputFileName;
        spec.save(function(err){
          if (err){
            return res.status(400).send({
              message : errorHandler.getErrorMessage(err)
            });
          }else{
            res.status(200).send({specFileName: ipfile,
              fileOriginalName: 'Not Applicable',
              outputFileName: outputFileName,
              uploadState: 'Data ready for timetable generation'});
          }
        });

      });
    }
  });
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

    j2eeClient.uploadUnsolvedFile(specId, unsolvedXMLFilePath, unsolvedXMLFileName, function(){
      j2eeClient.startSolver(specId, function(){
        res.status(200).send();
      });
    });
  });
};

/*
 * Is a solution in progress
 */
exports.isSolving = function(req, res){
  var specId = req.params.specId;
  j2eeClient.isSolving(specId, function(status){
    res.status(200).send(status);
  });
};

/*
 * Terminate current solving
 */
exports.terminateSolving = function(req, res) {
  var specId = req.params.specId;
  j2eeClient.terminateSolving(specId, function() {
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
  console.log('Req is ' + req.params.specId);
    var specId = req.params.specId;
    Spec.findById(specId).exec(function(err, spec) {
   		if (err) return err;
   		if (!spec) return (new Error('Failed to load Spec ' + specId));
   		console.log('Spec for this operation is %j', spec);
   	}).then(function(spec) {
      var splitPath = spec.unsolvedXML.split('/'); //Unsolved and solved XMLs have the same name
      var solvedXMLFileName = splitPath[splitPath.length - 1];
      var solvedXMLPath = './solved/'+ solvedXMLFileName;
      j2eeClient.getSolvedXML(specId, solvedXMLPath, function() {
        xmlUtils.solvedXMLParser(specId, solvedXMLPath, function () {
          Spec.update({'_id' : specId}, {$set : {'state' : 'Timetable Generated and Available for use'}}, function(){
            res.status(200).send({'uploadState' : 'Timetable Generated and Available for use' });
          });
        });
      });
    });
};

/**
 * List of Teachers
 */
exports.listTeachers = function (req, res) {
  console.log('finding teacher by specID ' + req.params.specId);
  Teacher.find({'specReference' : req.params.specId}).sort('code').exec(function (err, teachers) {
    if (err) {
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
    } else {
      return res.jsonp(teachers);
    }
  });
};

/** Add Sections to the Spec
 *
 */
exports.addSectionsForSpec = function(req, res) {
  var specId = req.params.specId;
  console.log('adding sections to ' + specId);
  console.log('sections to add: ' + req.body.sections);
  console.log('Length of sections: ' + req.body.sections.length);

    //Spec.update({'_id' : specId}, {$addToSet: {sections: {$each: req.body.sections}}},function(err, specToUpdate) {
  Spec.update({'_id' : specId}, {$set: {sections: req.body.sections}},function(err) {
    if (err) {
      console.log('Unable to find spec');
      return res.status(500).send({
        message : errorHandler.getErrorMessage(err)
      });
    }
    else
    {
      return res.status(200).send();
    }
  });
};

/**
 * Get Sections for the Spec
 */
exports.getSectionsForSpec = function(req, res) {
  var specId = req.params.specId;
  Spec.findById(specId).exec(function(err, spec){
    if (err) {
      return res.status(500).send({
        message : errorHandler.getErrorMessage(err)
      });
    }else{
      return res.jsonp(spec.sections);
    }
  });
};

/**
 * Add Assignments for the Spec
 */
exports.addAssignmentsForSpec = function(req, res) {
  var specId = req.params.specId;
  var assignments = req.body.assignments;
  console.log('assignments to save %j', assignments);
  console.log('Number of assignments to save ' + assignments.length);

  var assignmentsToSave = [];
  for (var i = 0; i < assignments.length; i++){
    var thisAssignment = new Assignment(assignments[i]);
    assignmentsToSave.push(thisAssignment);
  }
  Spec.update({'_id' : specId}, {$addToSet: {assignments: {$each: assignmentsToSave}}},function(err) {
    if (err) {
      console.log('Unable to find spec');
      return res.status(500).send({
        message : errorHandler.getErrorMessage(err)
      });
    }
    else {
      return res.status(200).send();
    }
  });
};


/**
 * Get Assignments for the Spec
 */
exports.getAssignmentsForSpec = function(req, res){
  var specId = req.params.specId;
    Spec.findById(specId).exec(function(err, spec){
      if (err) {
        return res.status(500).send({
          message : errorHandler.getErrorMessage(err)
        });
      }else{
        return res.jsonp(spec.assignments);
      }
    });
};

/**
 * Update Assignments in Spec
 */
exports.updateAssignmentsForSpec = function(req, res){
  var specId = req.params.specId;
  var assignments = req.body.assignments;
  console.log('assignments to update %j', assignments);

  Spec.update({'_id' : specId}, {$set: {assignments: assignments}},function(err) {
      if (err) {
        console.log('Unable to find spec');
        return res.status(500).send({
          message : errorHandler.getErrorMessage(err)
        });
      }
      else {
        return res.status(200).send();
      }
    });
};
