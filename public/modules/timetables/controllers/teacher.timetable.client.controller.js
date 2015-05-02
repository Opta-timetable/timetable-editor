/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TeacherTimetableController', ['$http', '$scope', '$stateParams', '$location', 'Authentication', 'Timetables', 'Teachers',
  function ($http, $scope, $stateParams, $location, Authentication, Timetables, Teachers) {
    $scope.authentication = Authentication;

    $scope.formatClassSubject = function (curriculum, subject) {
      if (curriculum && subject) {
        return curriculum + ', ' + subject;
      }
      return '';
    };

    $scope.findOne = function () {
      $scope.timetableForTeacher = Teachers.get({
        _id : $stateParams._id
      });

    };
  }
]);
