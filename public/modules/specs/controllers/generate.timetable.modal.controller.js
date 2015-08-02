'use strict';
angular.module('specs').controller('GenerateModalInstanceCtrl', function ($scope, $modalInstance, $http, specId) {

  $scope.specId = specId;
  $scope.progress = 45;
  console.log('SpecID for this modal is ' + specId);

  $scope.terminateSolving = function(){
    console.log('You want to solve? Are you sure?');
    $http.post('/specs/terminateSolving')
      .success(function (data, status, headers, config) {
        console.log('Terminated Solving');
      })
      .error(function (data, status, headers, config) {
        console.log('Error in termination');
      });
    $modalInstance.close();
  };

  $scope.dismiss = function(){
    $modalInstance.close();
  };

});
