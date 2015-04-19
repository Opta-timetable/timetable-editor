/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TimetablesController', ['$http', '$scope', '$stateParams', '$location', 'Authentication',
    'Timetables',
    function ($http, $scope, $stateParams, $location, Authentication, Timetables) {
        $scope.authentication = Authentication;
        $scope.clashes = [];
        $scope.history = []; //ToDo For undo-redo feature

        $scope.find = function () {
            //one timetable each for one curriculum
            $scope.curriculums = Timetables.query();
        };

        $scope.onDropComplete=function(data, evt, dayIndex, period){
            //Code to check if there is a clash in the existing assignment
            //If yes, send clash as well to the server
            //if new allocation removes clash, set clash to false
            //in any case remove existing clash controller array
            var clashToUpdate = {};
            if($scope.timetableForCurriculum.timetable.timetable[parseInt(dayIndex)].periods[parseInt(period)].clash === true){
                $scope.clashes.forEach(function(clash){
                    if ((clash.timetable.dayIndex === dayIndex) && (clash.timetable.periods.index === parseInt(period))){
                        clashToUpdate = clash;
                    }
                });
            }

            $http.post('/timetables/performDrop', {currentDay : dayIndex,
                currentPeriod : $scope.timetableForCurriculum.timetable.timetable[parseInt(dayIndex)].periods[parseInt(period)],
                allocatedCourse : data,
                clashToUpdate : clashToUpdate})
                .success(function(data, status, headers, config) {
                    if (data.clashIn.length >= 1){
                        $scope.timetableForCurriculum.timetable.timetable[parseInt(dayIndex)].periods[parseInt(period)].clash = true;
                        $scope.clashes = $scope.clashes.concat(data.clashIn);
                    }else{
                        $scope.timetableForCurriculum.timetable.timetable[parseInt(dayIndex)].periods[parseInt(period)].clash = false;
                    }
                    //remove clash in controller
                    $scope.clashes.splice($scope.clashes.indexOf(clashToUpdate), 1);
                })
                .error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    $scope.error = data.message;
                });
            $scope.timetableForCurriculum.timetable.timetable[parseInt(dayIndex)].periods[parseInt(period)].subject = data.code;
            $scope.timetableForCurriculum.timetable.timetable[parseInt(dayIndex)].periods[parseInt(period)].teacher = data._teacher.code;

        };

        $scope.done = function(){
            $scope.timetableForCurriculum.$update({
                curriculumId : $stateParams.curriculumId,
                clashes : $scope.clashes
            }, function() {
                $location.path('timetables/' + $stateParams.curriculumId);
            }, function (errorResponse) {
                $scope.error = errorResponse.data.message;
            });
        };

        $scope.findClashes = function(clash, dayIndex, period){
            if (clash === true){
                console.log('clash for this element :' + clash);
                console.log('day for this element :' + dayIndex);
                console.log('period for this element :' + period);
                $http.post('/timetables/discoverClashes', {currentDay : dayIndex,
                    currentPeriod : $scope.timetableForCurriculum.timetable.timetable[parseInt(dayIndex)].periods[parseInt(period)],
                    curriculumId : $stateParams.curriculumId})
                    .success(function(data, status, headers, config) {
                        if (data.clashIn.length >= 1){
                            $scope.clashes = $scope.clashes.concat(data.clashIn);
                        }
                    })
                    .error(function(data, status, headers, config) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                    });
            }
        };

        $scope.findOne = function () {
            $scope.timetableForCurriculum = Timetables.get({
                curriculumId : $stateParams.curriculumId
            });

        };
    }
]);
