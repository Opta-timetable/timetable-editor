'use strict';

var fs = require('fs'),
  http = require('http'),
  optaplannerServer = require('./OptaplannerServer.config.js');

exports.uploadUnsolvedFile = function(specID, filePath, fileName, callback) {

  var options = {
    hostname : optaplannerServer.config.hostname,
    port     : optaplannerServer.config.port,
    path     : optaplannerServer.config.basepath + '/specs/' + specID,
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
  fs.stat(filePath, function (err, stats) {
    if (err) {
      //TO DO
      console.log('Request error ' + err);
    } else {
      req.setHeader('Content-Length', stats.size);
      fs.createReadStream(filePath, {bufferSize : 4 * 1024})
        .on('end', function () {
          console.log('Reached EOF of file');
        })
        .pipe(req, {end : false});
    }
  });
  console.log('completed HTTP Request');
};

exports.startSolver = function(specID, callback){
  var options = {
    hostname : optaplannerServer.config.hostname,
    port     : optaplannerServer.config.port,
    path     : optaplannerServer.config.basepath + '/specs/' + specID + '/solution',
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
        hostname : optaplannerServer.config.hostname,
        port     : optaplannerServer.config.port,
          path     : optaplannerServer.config.basepath + '/specs/' + specID + '/solution',
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
      hostname : optaplannerServer.config.hostname,
      port     : optaplannerServer.config.port,
        path     : optaplannerServer.config.basepath + '/specs/' + specID + '/solution',
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
      hostname : optaplannerServer.config.hostname,
      port     : optaplannerServer.config.port,
        path     : optaplannerServer.config.basepath + '/specs/' + specID + '/solution',
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

// Using the method described here:
// http://stackoverflow.com/questions/11944932/how-to-download-a-file-with-node-js
var download = function(specID, dest, cb) {
  var file = fs.createWriteStream(dest);
  var options = {
    hostname : optaplannerServer.config.hostname,
    port     : optaplannerServer.config.port,
    path     : optaplannerServer.config.basepath + '/specs/' + specID,
    method   : 'GET'
  };
  var req = http.request(options, function(response) {
    //console.log('response is %j', response);
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  });
  req.on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
  req.end();
};

exports.getSolvedXML = function(specID, solvedXMLPath, callback){
  console.log('Calling j2ee client utils getSolvedXML');
  download(specID, solvedXMLPath, callback);
};

exports.deleteSpec = function(specID, callback){
      var options = {
        hostname : optaplannerServer.config.hostname,
        port     : optaplannerServer.config.port,
          path     : optaplannerServer.config.basepath + '/specs/' + specID,
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

