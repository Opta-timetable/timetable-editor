'use strict';


angular.module('core').controller('HomeController', ['$scope', '$http', 'Authentication', 'Version',
  function ($scope, $http, Authentication, Version) {
    // This provides Authentication context.
    $scope.authentication = Authentication;

    $scope.version = Version.get();

    $scope.upload = function(){
      $http.post('/upload')
        .success(function (data, status, headers, config) {
          console.log('Upload posted successfully');
        })
        .error(function (data, status, headers, config) {
          console.log('upload failed');
        });
    };
  }
]);
