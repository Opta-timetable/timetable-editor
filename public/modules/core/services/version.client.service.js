'use strict';

angular.module('core').factory('Version', ['$resource',
  function ($resource) {
    return $resource('version');
  }
]);

