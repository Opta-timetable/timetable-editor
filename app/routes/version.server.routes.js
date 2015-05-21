'use strict';

module.exports = function (app) {
  // Root routing
  var version = require('../../app/controllers/version.server.controller');
  app.route('/version').get(version.read);
};
