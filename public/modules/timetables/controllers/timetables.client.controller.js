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
            $http.post('/timetables/performDrop', {currentDay : dayIndex,
                currentPeriod : $scope.timetableForCurriculum.timetable.timetable[parseInt(dayIndex)].periods[parseInt(period)],
                allocatedCourse : data})
                .success(function(data, status, headers, config) {
                    if (data.clashIn.length >= 1){
                        $scope.timetableForCurriculum.timetable.timetable[parseInt(dayIndex)].periods[parseInt(period)].clash = true;
                        $scope.clashes = $scope.clashes.concat(data.clashIn);
                    }
                })
                .error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
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
