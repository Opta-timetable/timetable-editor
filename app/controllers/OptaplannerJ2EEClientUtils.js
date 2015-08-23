'use strict';

var fs = require('fs'),
  http = require('http');
var cookiesFromServer;

exports.uploadUnsolvedFile = function(filePath, fileName, callback) {

  var options = {
    hostname : 'localhost',
    port     : 8080,
    path     : '/123/timetable/upload',
    method   : 'POST'
  };

  var req = http.request(options, function (res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    cookiesFromServer = res.headers['set-cookie'];
    console.log('JsessionID will be useful: ' + JSON.stringify(cookiesFromServer));
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
      callback();
    });
  });

  req.on('error', function (e) {
    console.log('problem with request: ' + e.message);
  });

  // Used the second answer from here: http://stackoverflow.com/questions/5744990/how-to-upload-a-file-from-node-js
  // write data to request body
  var boundaryKey = '----' + Math.random().toString(16); // random string
  req.setHeader('Content-Type', 'multipart/form-data; boundary="' + boundaryKey + '"');
  // the header for the one and only part (need to use CRLF here)
  var fileReqHeader = '--' + boundaryKey + '\r\n' +
      // use your file's mime type here, if known
    'Content-Type: text/xml\r\n' +
      // "name" is the name of the form field
      // "filename" is the name of the original file
    'Content-Disposition: form-data; name="file"; filename="' + fileName + '"\r\n' +
    'Content-Transfer-Encoding: binary\r\n\r\n';
  var fileReqFooter = '\r\n\r\n--' + boundaryKey + '--';
  fs.stat(filePath, function (err, stats) {
    if (err) {
      //TO DO
    } else {
      req.setHeader('Content-Length', fileReqHeader.length + stats.size + fileReqFooter.length);
      req.write(fileReqHeader);
      fs.createReadStream(filePath, {bufferSize : 4 * 1024})
        .on('end', function () {
          console.log('Reached EOF of file');
          req.end(fileReqFooter);
        })
        .pipe(req, {end : false});
    }
  });
  console.log('completed HTTP Request');
};

exports.initializeSolver = function(callback){
  console.log('Will use cookies from last call: %j', cookiesFromServer);
  var options = {
    hostname : 'localhost',
    port     : 8080,
    path     : '/123/timetable/init',
    method   : 'POST'
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
  cookiesFromServer.forEach(function(cookieFromServer){
    req.setHeader('Cookie', cookieFromServer);
  });
  req.end();
};

exports.startSolver = function(callback){
  console.log('Will use cookies from last call: %j', cookiesFromServer);
  var options = {
      hostname : 'localhost',
      port     : 8080,
      path     : '/123/timetable/solve',
      method   : 'PUT'
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
    cookiesFromServer.forEach(function(cookieFromServer){
      req.setHeader('Cookie', cookieFromServer);
    });
    req.end();
};

exports.isSolving = function(callback){
  console.log('Will use cookies from last call: %j', cookiesFromServer);
    var options = {
        hostname : 'localhost',
        port     : 8080,
        path     : '/123/timetable/isSolving',
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
      cookiesFromServer.forEach(function(cookieFromServer){
        req.setHeader('Cookie', cookieFromServer);
      });
      req.end();
};

exports.terminateSolving = function(callback){
  console.log('Will use cookies from last call: %j', cookiesFromServer);
      var options = {
          hostname : 'localhost',
          port     : 8080,
          path     : '/123/timetable/terminateSolving',
          method   : 'PUT'
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
        cookiesFromServer.forEach(function(cookieFromServer){
          req.setHeader('Cookie', cookieFromServer);
        });
        req.end();
};

exports.currentSolutionScore = function(callback){
  console.log('Will use cookies from last call: %j', cookiesFromServer);
    var options = {
        hostname : 'localhost',
        port     : 8080,
        path     : '/123/timetable/currentSolutionScore',
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
      cookiesFromServer.forEach(function(cookieFromServer){
        req.setHeader('Cookie', cookieFromServer);
      });
      req.end();
};

// Using the method described here:
// http://stackoverflow.com/questions/11944932/how-to-download-a-file-with-node-js
var download = function(dest, cb) {
  var file = fs.createWriteStream(dest);
  var options = {
    hostname : 'localhost',
    port     : 8080,
    path     : '/123/timetable/solutionFile',
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
  cookiesFromServer.forEach(function(cookieFromServer){
    req.setHeader('Cookie', cookieFromServer);
  });
  req.end();
};

exports.getSolvedXML = function(solvedXMLPath, callback){
  console.log('Calling j2ee client utils getSolvedXML');
  download(solvedXMLPath, callback);
};


