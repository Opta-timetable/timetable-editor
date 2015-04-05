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
                                                    currentPeriod : $scope.timetable[parseInt(dayIndex)].periods[parseInt(period)],
                                                    allocatedCourse : data })
                .success(function(data, status, headers, config) {
                    if (data.clashIn.length >= 1){
                        $scope.timetable[parseInt(dayIndex)].periods[parseInt(period)].clash = true;
                    }
            })
                .error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    console.log("Error during validation");
                });
            console.log("dropping in: " + dayIndex + " Period: " + period);
            $scope.timetable[parseInt(dayIndex)].periods[parseInt(period)].subject = data.code;
            $scope.timetable[parseInt(dayIndex)].periods[parseInt(period)].teacher = data._teacher.code;

        };

        $scope.findOne = function () {
            Timetables.get({
                curriculumId : $stateParams.curriculumId
            }, function(result){

                $scope.timetable = result.timetable.timetable;
                console.log("TimeTable is " + JSON.stringify($scope.timetable));
                console.log("Sample period is : " + $scope.timetable[0].periods[0].subject);
                $scope.courses = result.courses;

                //Which curriculum was selected?
                var curriculums = Curriculums.get();
                for(var k=0; k<curriculums.length; k++){
                    if (curriculums[k].id === $stateParams.curriculumId){
                        $scope.curriculumSelected = curriculums[k];
                    }
                }
            });
        };
    }
]);
