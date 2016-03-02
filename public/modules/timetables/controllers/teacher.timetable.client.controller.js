/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TeacherTimetableController', ['$http', '$scope', '$stateParams', '$location', 'Authentication', 'Timetables', 'TimetableForTeacher', 'SpecIdHolder',
  function ($http, $scope, $stateParams, $location, Authentication, Timetables, TimetableForTeacher, SpecIdHolder) {
    $scope.authentication = Authentication;

    $scope.formatClassSubject = function (period) {
      var allocationStr = '';
      if (period.curriculum && period.subject) {
        allocationStr = period.curriculum + ', ' + period.subject;
      }
      if (period.clash){
        for (var i = 0; i < period.clashes.length; i++){
          allocationStr = allocationStr + ', [' + period.clashes[i].clashInCurriculum + ', ' + period.clashes[i].clashInSubject + ']';
        }
      }
      return allocationStr;
    };

    $scope.findOne = function () {
      $scope.showSpinner = true;
      $scope.specId = SpecIdHolder.getSpecId();
      $scope.timetableForTeacher = TimetableForTeacher.get({
        specId : $scope.specId,
        id : $stateParams.id
      }, function(){
        $scope.showSpinner = false;
      });

    };
  }
]);
