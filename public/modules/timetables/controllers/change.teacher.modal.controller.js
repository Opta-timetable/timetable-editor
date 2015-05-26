/*jshint unused: false */
'use strict';
angular.module('timetables').controller('ModalInstanceCtrl', function ($scope, $modalInstance, teachers, subjectCode) {

  $scope.teachers = teachers;
  $scope.subjectCode = subjectCode;
  $scope.selectedTeacher = {};
  $scope.newTeacher = false;

  $scope.selectTeacher = function(teacher){
    $scope.newTeacher = false;
    $scope.selectedTeacher = teacher;
  };

  $scope.ok = function () {
    $modalInstance.close({selectedTeacher: $scope.selectedTeacher, isNew: $scope.newTeacher});
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

  $scope.createNewTeacher = function () {
    $scope.newTeacher = true;

  };

});
