/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TimetablesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Timetables',
  function ($scope, $stateParams, $location, Authentication, Timetables) {
    $scope.authentication = Authentication;

    $scope.find = function () {
        //one timetable each for one curriculum
      $scope.curriculums = Timetables.query();
    };

    $scope.findOne = function () {
      Timetables.get({
        curriculumId : $stateParams.curriculumId
      }, function(lectures){
          //Translating lectures array into a timetable here. Have to discuss with Hari
          //using DataTables for now for helping with the export feature
          var timeTableData = [];
          var dayName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

          //Initialise - Assuming hardcoded metadata (number of days, number of periods)
          for (var i=0; i<5; i++){
              var allocationsForDayOfWeek = {};
              allocationsForDayOfWeek.dayOfWeek = dayName[i];
              allocationsForDayOfWeek.dayIndex = i;
              for (var k=0; k<7; k++){
                  allocationsForDayOfWeek["Period-"+k] = "";
              }
              timeTableData.push(allocationsForDayOfWeek);
          }

          for(var j=0; j<lectures.length; j++){
              var dayIndex = lectures[j]._period.dayIndex;
              var period = lectures[j]._period.timeslotIndex;
              var subject = lectures[j]._course.code;

              timeTableData[parseInt(dayIndex)]["Period-"+parseInt(period)] = subject;
          }
          $scope.timetable = timeTableData;
      });




    };
  }
]);
