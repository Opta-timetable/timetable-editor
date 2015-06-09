'use strict';
var querystring = require('querystring');
var http = require('http');


/**
 * Module dependencies.
 */
exports.index = function (req, res) {
  res.render('index', {
    user    : req.user || null,
    request : req
  });
};

exports.upload = function (req, res) {
  var post_data = querystring.stringify({
    'compilation_level' : 'ADVANCED_OPTIMIZATIONS',
    'output_format': 'json',
    'output_info': 'compiled_code',
    'warning_level' : 'QUIET',
    'js_code' : req.codestring
  });

  // An object of options to indicate where to post to
  var post_options = {
    host: 'localhost',
    port: '8080',
    path: '/myresource/upload',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  };

  // Set up the request
  var post_req = http.request(post_options, function(serverRes) {
    serverRes.setEncoding('utf8');
    serverRes.on('data', function (chunk) {
      console.log('Response: ' + chunk);
      res.status(200).send({message : 'post upload was successful'});
    });
  });

  post_req.write(post_data);
  post_req.end();
};
