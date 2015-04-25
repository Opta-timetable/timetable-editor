/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TimetablesController', ['$http', '$scope', '$stateParams', '$location', 'Authentication',
    'Timetables',
    function ($http, $scope, $stateParams, $location, Authentication, Timetables) {
        $scope.authentication = Authentication;
        $scope.clashes = [];
        $scope.history = []; //ToDo For undo-redo feature
        $scope.historyIndex = 0;
        $scope.undoStack = [];
        $scope.redoStack = [];

        $scope.find = function () {
            //one timetable each for one curriculum
            $scope.curriculums = Timetables.query();
        };

        $scope.undoEdit = function () {

            var periodFromUndoStack = $scope.undoStack.shift();

            console.log('Value for Undo from stack ' + JSON.stringify(periodFromUndoStack));

            var redoData = {};
            redoData.dayIndex = periodFromUndoStack.dayIndex;
            redoData.periodIndex = periodFromUndoStack.periodIndex;
            redoData.teacher = $scope.timetableForCurriculum.timetable.timetable[parseInt(periodFromUndoStack.dayIndex)]
                .periods[parseInt(periodFromUndoStack.periodIndex)].teacher;
            redoData.subject = $scope.timetableForCurriculum.timetable.timetable[parseInt(periodFromUndoStack.dayIndex)]
                .periods[parseInt(periodFromUndoStack.periodIndex)].subject;
            console.log('saving for redo ' + JSON.stringify(redoData));
            $scope.redoStack.push(redoData);

            //For Reference: var dayToMatch = req.body.currentDay,
            //    periodIndex = req.body.currentPeriod.index,
            //    teacher = req.body.allocatedCourse._teacher.code,
            //    curriculum = req.body.allocatedCourse.curriculumReference,
            //    subject = req.body.allocatedCourse.code,
            //    clashToUpdate = req.body.clashToUpdate;
            var undoData = {};
            undoData._teacher = {};
            undoData._teacher.code = periodFromUndoStack.teacher;
            undoData.code = periodFromUndoStack.subject;
            undoData.curriculumReference = $stateParams.curriculumId;
            console.log('About to drop: ' + JSON.stringify(undoData));

            $scope.onDropComplete(undoData, null, periodFromUndoStack.dayIndex, periodFromUndoStack.periodIndex, true);

        };

        $scope.redoEdit = function () {
            var periodFromRedoStack = $scope.redoStack.shift();
            $scope.undoStack.unshift(periodFromRedoStack);

            var redoData = {};
            redoData._teacher = {};
            redoData._teacher.code = periodFromRedoStack.teacher;
            redoData.code = periodFromRedoStack.subject;
            redoData.curriculumReference = $stateParams.curriculumId;

            console.log('About to drop: ' + JSON.stringify(redoData));
            $scope.onDropComplete(redoData, null, periodFromRedoStack.dayIndex, periodFromRedoStack.periodIndex, false);
        };

        $scope.onDropComplete=function(data, evt, dayIndex, period, undoRedo){
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
                //remove clash in controller. It will get updated with the new one if any
                $scope.clashes.splice($scope.clashes.indexOf(clashToUpdate), 1);
            }
            console.log('clash to update is ' + JSON.stringify(clashToUpdate));
            if (undoRedo === false){
                //Backup current period
                var periodInfo = {};
                periodInfo.dayIndex = dayIndex;
                periodInfo.periodIndex = period;
                periodInfo.subject = $scope.timetableForCurriculum.timetable.timetable[parseInt(dayIndex)].periods[parseInt(period)].subject;
                periodInfo.teacher = $scope.timetableForCurriculum.timetable.timetable[parseInt(dayIndex)].periods[parseInt(period)].teacher;

                $scope.undoStack.unshift(periodInfo);

                console.log('saving following for undo operation ' + JSON.stringify(periodInfo));
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
