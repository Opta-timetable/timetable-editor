'use strict';


angular.module('core').controller('HomeController', ['$scope', 'Authentication', 'Version',
  function ($scope, Authentication, Version) {
    // This provides Authentication context.
    $scope.authentication = Authentication;

    $scope.version = Version.get();
  }
]);
