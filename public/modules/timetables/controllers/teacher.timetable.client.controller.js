/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TeacherTimetableController', ['$http', '$scope', '$stateParams', '$location', 'Authentication', 'Timetables', 'Teachers',
  function ($http, $scope, $stateParams, $location, Authentication, Timetables, Teachers) {
    $scope.authentication = Authentication;

    $scope.findOne = function () {
      $scope.timetableForTeacher = Teachers.get({
        _id : $stateParams._id
      });

    };
  }
]);
