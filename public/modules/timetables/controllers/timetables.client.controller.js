/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TimetablesController', ['$http', '$scope', '$stateParams', '$location', 'Authentication', 'Timetables',
  function ($http, $scope, $stateParams, $location, Authentication, Timetables) {
    $scope.authentication = Authentication;
    $scope.clashes = [];
    $scope.history = []; //ToDo For undo-redo feature
    $scope.historyIndex = 0;
    $scope.undoStack = [];
    $scope.redoStack = [];

    function popClashFromLocalList(currentPeriod, dayIndex, periodIndex) {
      var clashToUpdate = {};
      if (currentPeriod.clash) {
        clashToUpdate = $scope.clashes.filter(function (clash) {
          // Array.filter -> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
          return clash.days.dayIndex === dayIndex && clash.days.periods.index === parseInt(periodIndex);
        });

        // remove this clash from the local array (in the controller).
        // It will get updated with the new one, if any
        $scope.clashes.splice($scope.clashes.indexOf(clashToUpdate), 1);
      }
      console.log('clash to update is ' + JSON.stringify(clashToUpdate));
      return clashToUpdate;
    }

    function updatePeriodAllocation(dayIndex, periodIndex, currentPeriod, allocatedCourse, currentClash) {
      $http.post('/timetables/performDrop', {
        currentDay      : dayIndex,
        currentPeriod   : currentPeriod,
        allocatedCourse : allocatedCourse,
        clashToUpdate   : currentClash
      })
        .success(function (data, status, headers, config) {
          var updatedPeriod = $scope.timetableForCurriculum.timetable.days[parseInt(dayIndex)].periods[parseInt(periodIndex)];
          if (data.clashIn.length >= 1) {
            updatedPeriod.clash = true;
            $scope.clashes = $scope.clashes.concat(data.clashIn);
          } else {
            updatedPeriod.clash = false;
          }
        })
        .error(function (data, status, headers, config) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          $scope.error = data.message;
        });
    }

    $scope.find = function () {
      //one timetable each for one curriculum
      $scope.curriculums = Timetables.query();
    };

    $scope.undo = function () {

      var periodFromUndoStack = $scope.undoStack.pop();

      console.log('Value for Undo from stack ' + JSON.stringify(periodFromUndoStack));

      var redoData = {};
      redoData.dayIndex = periodFromUndoStack.dayIndex;
      redoData.periodIndex = periodFromUndoStack.periodIndex;
      var period = $scope.timetableForCurriculum.timetable.days[parseInt(periodFromUndoStack.dayIndex)]
        .periods[parseInt(periodFromUndoStack.periodIndex)];
      redoData.teacher = period.teacher;
      redoData.subject = period.subject;
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

    $scope.redo = function () {
      var periodFromRedoStack = $scope.redoStack.pop();
      $scope.undoStack.push(periodFromRedoStack);

      var redoData = {};
      redoData._teacher = {};
      redoData._teacher.code = periodFromRedoStack.teacher;
      redoData.code = periodFromRedoStack.subject;
      redoData.curriculumReference = $stateParams.curriculumId;

      console.log('About to drop: ' + JSON.stringify(redoData));
      $scope.onDropComplete(redoData, null, periodFromRedoStack.dayIndex, periodFromRedoStack.periodIndex, false);
    };

    $scope.onDropComplete = function (allocatedCourse, evt, dayIndex, periodIndex, isUndo) {
      // Code to check if there is a clash in the existing assignment
      // If yes, send clash as well to the server
      // if new allocation removes clash, set clash to false
      // in any case remove existing clash controller array
      var currentPeriod = $scope.timetableForCurriculum.timetable.days[parseInt(dayIndex)].periods[parseInt(periodIndex)];

      // get the clash for the current period, if any after removing it from the local list
      var clashToUpdate = popClashFromLocalList(currentPeriod, dayIndex, periodIndex);

      if (!isUndo) {
        //Backup current period
        var periodInfo = {
          dayIndex    : dayIndex,
          periodIndex : periodIndex,
          subject     : currentPeriod.subject,
          teacher     : currentPeriod.teacher
        };
        $scope.undoStack.push(periodInfo);

        console.log('saving following for undo operation ' + JSON.stringify(periodInfo));
      }

      // call the API to update the period allocation setting up callbacks
      updatePeriodAllocation(dayIndex, periodIndex, currentPeriod, allocatedCourse, clashToUpdate);

      // Update the subject and teacher on the period within the scope to update the UI
      currentPeriod.subject = allocatedCourse.code;
      currentPeriod.teacher = allocatedCourse._teacher.code;
    };

    $scope.finish = function () {
      $scope.timetableForCurriculum.$update({
        curriculumId : $stateParams.curriculumId,
        clashes      : $scope.clashes
      }, function () {
        $location.path('timetables/' + $stateParams.curriculumId);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.findClashes = function (clash, dayIndex, period) {
      if (clash === true) {
        console.log('clash for this element :' + clash);
        console.log('day for this element :' + dayIndex);
        console.log('period for this element :' + period);
        $http.post('/timetables/discoverClashes', {
          currentDay    : dayIndex,
          currentPeriod : $scope.timetableForCurriculum.timetable.days[parseInt(dayIndex)].periods[parseInt(period)],
          curriculumId  : $stateParams.curriculumId
        })
          .success(function (data, status, headers, config) {
            if (data.clashIn.length >= 1) {
              $scope.clashes = $scope.clashes.concat(data.clashIn);
            }
          })
          .error(function (data, status, headers, config) {
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
