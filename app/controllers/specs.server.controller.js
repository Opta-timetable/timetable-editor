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
  Teacher = mongoose.model('Lecturer'),
  Timetable = mongoose.model('Timetable'),
  Course = mongoose.model('Course'),
  Curriculum = mongoose.model('Curriculum'),
  Lecture = mongoose.model('Lecture'),
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

  //Delete Courses, Curriculums, Lecturers, Timetables where the Spec Id matches and finally the
  //Spec itself

  Course.find({specReference : spec._id}).remove().exec()
    .then(function(){
      return Curriculum.find({specReference : spec._id}).remove().exec();
    })
    .then(function(){
      return Teacher.find({specReference : spec._id}).remove().exec();
    })
    .then(function(){
      return Timetable.find({specReference : spec._id}).remove().exec();
    })
    .then(function(){
      return Lecture.find({specReference : spec._id}).remove().exec();
    })
    .then(function(){
      return Spec.findByIdAndRemove(spec._id).exec();
    }).then(function(){
      res.jsonp(spec);
    })
    .then(null, function(err){
      return res.status(400).send({
        message : errorHandler.getErrorMessage(err)
      });
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
var createHandler = function (csvStringBuffer, numberOfWorkingDaysInAWeek, numberOfPeriodsInADay) {

  xmlUtils.clearRawData();
    for (var j=0; j<csvStringBuffer.length; j++){
      console.log('row :', csvStringBuffer[j]);
      xmlUtils.addRawData(csvStringBuffer[j]);
    }
    var xmlString = xmlUtils.prepareXML(numberOfWorkingDaysInAWeek, numberOfPeriodsInADay);
  return xmlString;

};
/*
 * Upload Spec file - Used if CSV is uploaded by user
 * TODO Arun 24/2/2016 Remove upload CSV flow for spec generation
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
        spec.state = 'Data ready for timetable generation';
        //spec.unsolvedXML = outputFileName;
        spec.save(function(err){
          if (err){
            return res.status(400).send({
              message : errorHandler.getErrorMessage(err)
            });
          }else{
            res.status(200).send({specFileName: 'Not Applicable',
              fileOriginalName: 'Not Applicable',
              outputFileName: 'Not Applicable',
              uploadState: 'Data ready for timetable generation'});
          }
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
    var csvStringBuffer = [];
    var assignments = spec.assignments;
    if (spec.assignments && spec.assignments.length > 0){
      //csvStringBuffer.push('Class,Subject,Teacher,PeriodsInAWeek');
      for (var i=0; i<assignments.length; i++){
        csvStringBuffer.push(assignments[i].section + ',' +
        assignments[i].subjectCode + ',' +
        assignments[i].teacherCode + ',' +
        assignments[i].numberOfClassesInAWeek);
      }
      console.log('Assignments in Comma Separated Values Prepared: %j', csvStringBuffer);

      //Generate the unsolved XML string buffer
      var xmlString = createHandler(csvStringBuffer, spec.numberOfWorkingDaysInAWeek, spec.numberOfPeriodsInADay);
      //console.log('Unsolved XML Array is :' + xmlString);

      j2eeClient.uploadUnsolvedFile(specId, xmlString, function(){
        j2eeClient.startSolver(specId, function(){
          res.status(200).send();
        });
      });

    }else{
      //No assignments found
      res.status(500).send({
        message : 'No Assignments found for this Spec'
      });
    }
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
  var xmlSolution = {'solution' : ''};
    var specId = req.params.specId;
    Spec.findById(specId).exec(function(err, spec) {
   		if (err) return err;
   		if (!spec) return (new Error('Failed to load Spec ' + specId));
   		console.log('Spec for this operation is %j', spec);
   	}).then(function(spec) {
      j2eeClient.getSolvedXML(specId, xmlSolution, function() {
        xmlUtils.solvedXMLParser(specId, xmlSolution, spec.numberOfWorkingDaysInAWeek, spec.numberOfPeriodsInADay, function () {
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
/*

*/
/**
 * Add Assignments for the Spec
 *//*

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
*/


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
