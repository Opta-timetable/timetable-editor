'use strict';

angular.module('core').controller('FooterController', ['$scope', 'Version',
  function ($scope, Version) {
    $scope.version = Version.get();
  }
]);
