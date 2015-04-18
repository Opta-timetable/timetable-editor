/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TimetablesController', ['$http', '$scope', '$stateParams', '$location', 'Authentication',
    'Timetables',
    function ($http, $scope, $stateParams, $location, Authentication, Timetables) {
        $scope.authentication = Authentication;
        $scope.clashes = [];

        $scope.find = function () {
            //one timetable each for one curriculum
            $scope.curriculums = Timetables.query();
        };

        $scope.onDropComplete=function(data, evt, dayIndex, period){
            $http.post('/timetables/validateDrop', {currentDay : dayIndex,
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

        $scope.save = function(){
            $scope.timetableForCurriculum.$update({
                curriculumId : $stateParams.curriculumId,
                clashes : $scope.clashes
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

        };
    }
]);
