/*jshint unused: false */
'use strict';

angular.module('timetables').controller('DayTimetableController', ['$http', '$scope', '$stateParams', '$location', 'Authentication', 'Days', 'Teachers',
  function ($http, $scope, $stateParams, $location, Authentication, Days, Teachers) {
    $scope.authentication = Authentication;

    $scope.formatSubjectTeacher = function (subject, teacher) {
      if (subject && teacher) {
        return subject + ', ' + teacher;
      }
      return '';
    };

    $scope.unassignedTeachersForPeriod = [];

    function getAllTeachers(){
      var allTeachers = [];
      //Not initialised yet. Let's do it now
      $scope.teachers.forEach(function(teacher){
        allTeachers.push(teacher.code);
      });
      return allTeachers;
    }

    function findAndRemoveFromArray(array, val){
      var index = array.indexOf(val);
      if (index > -1){
        return array.splice(index, 1);
      }
      return array;
    }

    function prepareUnassignedTeachersForPeriods(){
      if ($scope.timetable.timetableForDay && $scope.timetable.timetableForDay.length > 0 &&
        $scope.teachers && $scope.teachers.length > 0) {
        var timetableForDay = $scope.timetable.timetableForDay;
        for (var i=0; i < timetableForDay[0].days.periods.length; i++){
          // For each Period in the day get all teachers first and then ...
          // Iterate through timetable and remove the assigned teachers
          var unassignedTeachers = getAllTeachers();
          for (var j = 0; j < timetableForDay.length; j++){
            findAndRemoveFromArray(unassignedTeachers, timetableForDay[j].days.periods[i].teacher);
          }
          $scope.unassignedTeachersForPeriod.push(unassignedTeachers);
        }
      }
    }

    $scope.formatUnassignedTeachers = function(period){
        return $scope.unassignedTeachersForPeriod[period].join(', ');
    };

    $scope.findOne = function () {
      $scope.specId = $stateParams.specId;
      $scope.timetable = Days.get({
        specId : $scope.specId,
        dayIndex : $stateParams.dayIndex
      });
      $scope.teachers = Teachers.query({specId : $scope.specId});
    };

    //Due to the checks there, only one of the below will trigger the prepareUnassignedTeachersForPeriods Functionality.
    $scope.$watch('timetable.timetableForDay.length > 0', prepareUnassignedTeachersForPeriods);
    $scope.$watch('teachers.length > 0', prepareUnassignedTeachersForPeriods);
  }
]);
