'use strict';

var fs = require('fs'),
  http = require('http'),
  config = require('../../config/config');

exports.uploadUnsolvedFile = function(specID, unsolvedXMLString, callback) {

  var options = {
    hostname : config.optaplannerService.hostname,
    port     : config.optaplannerService.port,
    path     : config.optaplannerService.basepath + '/specs/' + specID,
    method   : 'POST'
  };

  var req = http.request(options, function (res) {
    console.log('STATUS: ' + res.statusCode);
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
      callback();
    });
  });

  req.on('error', function (e) {
    console.log('problem with request: ' + e.message);
  });

  // write data to request body
  req.setHeader('Content-Type', 'text/plain');
  req.setHeader('Content-Length', unsolvedXMLString.length);
  req.write(unsolvedXMLString);
  req.end();

  console.log('completed HTTP Request');
};

exports.startSolver = function(specID, callback){
  var options = {
    hostname : config.optaplannerService.hostname,
    port     : config.optaplannerService.port,
    path     : config.optaplannerService.basepath + '/specs/' + specID + '/solution',
    method   : 'POST'
  };
    var req = http.request(options, function (res) {
      console.log('STATUS: ' + res.statusCode);
      console.log('HEADERS: ' + JSON.stringify(res.headers));
      //res.setEncoding('utf8');
      callback();
    });
    req.on('error', function (e) {
      console.log('problem with request: ' + e.message);
      callback();
    });
    req.end();
};

exports.terminateSolving = function(specID, callback){
      var options = {
        hostname : config.optaplannerService.hostname,
        port     : config.optaplannerService.port,
          path     : config.optaplannerService.basepath + '/specs/' + specID + '/solution',
          method   : 'DELETE'
            };
        var req = http.request(options, function (res) {
          console.log('STATUS: ' + res.statusCode);
          console.log('HEADERS: ' + JSON.stringify(res.headers));
          //res.setEncoding('utf8');
          res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
            callback();
          });
        });
        req.on('error', function (e) {
          console.log('problem with request: ' + e.message);
        });
        req.end();
};

exports.isSolving = function(specID, callback){
    var options = {
      hostname : config.optaplannerService.hostname,
      port     : config.optaplannerService.port,
        path     : config.optaplannerService.basepath + '/specs/' + specID + '/solution',
        method   : 'GET'
          };
      var req = http.request(options, function (res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        //res.setEncoding('utf8');
        res.on('data', function (chunk) {
          console.log('BODY: ' + chunk);
          callback(chunk);
        });
      });
      req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
      });
      req.end();
};

exports.getScore = function(specID, callback){
    var options = {
      hostname : config.optaplannerService.hostname,
      port     : config.optaplannerService.port,
        path     : config.optaplannerService.basepath + '/specs/' + specID + '/solution',
        method   : 'GET'
          };
      var req = http.request(options, function (res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        //res.setEncoding('utf8');
        res.on('data', function (chunk) {
          console.log('BODY: ' + chunk);
          callback(chunk);
        });
      });
      req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
      });
      req.end();
};

var download = function(specID, xmlSolution, cb) {
  var options = {
    hostname : config.optaplannerService.hostname,
    port     : config.optaplannerService.port,
    path     : config.optaplannerService.basepath + '/specs/' + specID,
    method   : 'GET'
  };
  var req = http.request(options, function(response) {
    var solutionString = '';
    console.log('Received response to download spec file');
    console.log('STATUS: ' + response.statusCode);
    console.log('HEADERS: ' + JSON.stringify(response.headers));
    response.setEncoding('utf8');
    response.on('data', function(chunk){
      console.log('BODY: ' + chunk);
      solutionString = solutionString.concat(chunk);
    });
    response.on('end', function(){
      console.log('No more data in response.');
      xmlSolution.solution = solutionString;
      console.log('Complete Solution received is + ' + xmlSolution.solution);
      cb();
    });
  });

  req.on('error', function(err) { // Handle errors
    console.log('Received error from request');
    if (cb) cb(err.message);
  });
  req.end();
};

exports.getSolvedXML = function(specID, xmlSolution, callback){
  console.log('Calling j2ee client utils getSolvedXML');
  download(specID, xmlSolution, callback);
};

exports.deleteSpec = function(specID, callback){
      var options = {
        hostname : config.optaplannerService.hostname,
        port     : config.optaplannerService.port,
          path     : config.optaplannerService.basepath + '/specs/' + specID,
          method   : 'DELETE'
            };
        var req = http.request(options, function (res) {
          console.log('STATUS: ' + res.statusCode);
          console.log('HEADERS: ' + JSON.stringify(res.headers));
          //res.setEncoding('utf8');
          res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
            callback();
          });
        });
        req.on('error', function (e) {
          console.log('problem with request: ' + e.message);
        });
        req.end();
};

