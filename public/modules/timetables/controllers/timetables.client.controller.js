/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TimetablesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Timetables', 'Curriculums',
  function ($scope, $stateParams, $location, Authentication, Timetables, Curriculums) {
    $scope.authentication = Authentication;

    $scope.find = function () {
        //one timetable each for one curriculum
      $scope.curriculums = Timetables.query();
        //need to share with other views
      Curriculums.set($scope.curriculums);
    };
  }
]);

angular.module('timetables').controller('TimetableController', ['$http', '$scope', '$stateParams', '$location', 'Authentication',
    'Timetables', 'Curriculums',
    function ($http, $scope, $stateParams, $location, Authentication, Timetables, Curriculums) {
        $scope.authentication = Authentication;

        $scope.onDropComplete=function(data, evt, dayIndex, period){
            $http.post('/timetables/validateDrop', {currentDay : dayIndex,
                currentPeriod : $scope.timetableForCurriculum.timetable.timetable[parseInt(dayIndex)].periods[parseInt(period)],
                allocatedCourse : data })
                .success(function(data, status, headers, config) {
                    if (data.clashIn.length >= 1){
                        $scope.timetableForCurriculum.timetable.timetable[parseInt(dayIndex)].periods[parseInt(period)].clash = true;
                    }
                })
                .error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    console.log("Error during validation");
                });
            console.log("dropping in: " + dayIndex + " Period: " + period);
            $scope.timetableForCurriculum.timetable.timetable[parseInt(dayIndex)].periods[parseInt(period)].subject = data.code;
            $scope.timetableForCurriculum.timetable.timetable[parseInt(dayIndex)].periods[parseInt(period)].teacher = data._teacher.code;

        };

        $scope.save = function(){
            console.log("About to save: " + $stateParams.curriculumId);
            $scope.timetableForCurriculum.$update({
                curriculumId : $stateParams.curriculumId
            }, function() {
                $location.path('timetables/' + $stateParams.curriculumId);
            }, function (errorResponse) {
                $scope.error = errorResponse.data.message;
            });
        };

        $scope.findOne = function () {
            $scope.timetableForCurriculum = Timetables.get({
                curriculumId : $stateParams.curriculumId
            });
            //Which curriculum was selected?
            var curricula = Curriculums.get();
            for(var k=0; k<curricula.length; k++){
                if (curricula[k].id === $stateParams.curriculumId){
                    $scope.curriculumSelected = curricula[k];
                }
            }
        };
    }
]);
