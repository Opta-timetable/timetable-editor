'use strict';

var getLatestTag = require('git-latest-tag');

exports.read = function (req, res) {
  // Get the output of 'git describe' as the version string
  getLatestTag({dirty : '*'}, function (err, latestTag) {
    var versionString = '';
    if (err) {
      // Fallback to the version on package.json
      var pkg = require('../../package.json');
      versionString = 'v' + pkg.version;
    } else {
      versionString = latestTag;
    }
    res.json({versionString : versionString});
  });
};
