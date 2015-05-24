/*jshint unused: false */
'use strict';
angular.module('timetables').controller('ModalInstanceCtrl', function ($scope, $modalInstance, teachers, subjectCode) {

  $scope.teachers = teachers;
  $scope.subjectCode = subjectCode;
  $scope.selectedTeacher = null;

  $scope.selectTeacher = function(teacher){
    $scope.selectedTeacher = teacher;
  };

  $scope.ok = function () {
    $modalInstance.close($scope.selectedTeacher);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

});
