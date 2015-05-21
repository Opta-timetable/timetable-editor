'use strict';

var getLatestTag = require('git-latest-tag');

exports.read = function (req, res) {
  getLatestTag({dirty: '*'}, function (err, latestTag) {
    if (err) {
      res.send(JSON.stringify(err), 500);
    } else {
      res.json({versionString : latestTag});
    }
  });
};
