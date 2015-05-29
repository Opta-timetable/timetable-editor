/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TeacherTimetableController', ['$http', '$scope', '$stateParams', '$location', 'Authentication', 'Timetables', 'Teachers',
  function ($http, $scope, $stateParams, $location, Authentication, Timetables, Teachers) {
    $scope.authentication = Authentication;

    $scope.formatClassSubject = function (period) {
      var allocationStr = '';
      if (period.curriculum && period.subject) {
        allocationStr = period.curriculum + ', ' + period.subject;
      }
      if (period.clash){
        allocationStr = allocationStr + ' [' + period.clashInCurriculum + ', ' + period.clashInSubject + ']';
      }
      return allocationStr;
    };

    $scope.findOne = function () {
      $scope.timetableForTeacher = Teachers.get({
        _id : $stateParams._id
      });

    };
  }
]);
