/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TimetablesController', ['$http', '$scope', '$stateParams', '$location', 'Authentication', 'Timetables', 'Teachers',
  function ($http, $scope, $stateParams, $location, Authentication, Timetables, Teachers) {
    $scope.authentication = Authentication;
    $scope.clashes = [];
    $scope.history = [];
    $scope.undoStack = [];
    $scope.redoStack = [];

    function extractPeriod(dayIndex, periodIndex) {
      var dayIndexAsInt = (typeof dayIndex === 'number') ? dayIndex : parseInt(dayIndex, 10);
      var periodIndexAsInt = typeof periodIndex === 'number' ? periodIndex : parseInt(periodIndex, 10);
      return $scope.timetableForCurriculum.timetable.days[dayIndexAsInt].periods[periodIndexAsInt];
    }

    function popClashFromLocalList(dayIndex, periodIndex) {
        debugger;
      var clashToUpdate = {};
      var currentPeriod = extractPeriod(dayIndex, periodIndex);

      if (currentPeriod.clash) {
        clashToUpdate = $scope.clashes.filter(function (clash) {
          // Array.filter -> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
          return clash.days.dayIndex === dayIndex && clash.days.periods.index === parseInt(periodIndex);
        })[0]; //Filter returns an array of matches

        // remove this clash from the local array (in the controller).
        // It will get updated with the new one, if any
        $scope.clashes.splice($scope.clashes.indexOf(clashToUpdate), 1);
      }

      console.log('clash to update is ' + JSON.stringify(clashToUpdate));

      return clashToUpdate;
    }

    function updateAllocation(dayIndex, periodIndex, allocatedCourse, currentClash) {
      $http.post('/timetables/performDrop', {
        currentDay      : dayIndex,
        currentPeriod   : extractPeriod(dayIndex, periodIndex),
        allocatedCourse : allocatedCourse,
        clashToUpdate   : currentClash
      })
        .success(function (data, status, headers, config) {
          var updatedPeriod = extractPeriod(dayIndex, periodIndex);
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

    function applyAllocation(allocation) {
        debugger;
      // extract the indices
      var dayIndex = allocation.dayIndex;
      var periodIndex = allocation.periodIndex;

      // build an allocatedCourse from the after object of the allocation
      var allocatedCourse = {
        code                : allocation.after.subject,
        _teacher            : {
          code : allocation.after.teacher
        },
        curriculumReference : $stateParams.curriculumId
      };

      // get the clash for the current period, if any after removing it from the local list
      var clashToUpdate = popClashFromLocalList(dayIndex, periodIndex);

      // call the API to update the period allocation setting up callbacks
      updateAllocation(dayIndex, periodIndex, allocatedCourse, clashToUpdate);

      // Update the UI to reflect the after state of the allocation
      var period = extractPeriod(dayIndex, periodIndex);
      period.subject = allocation.after.subject;
      period.teacher = allocation.after.teacher;

      // Add allocation to history
      $scope.history.unshift(allocation);
    }

    $scope.formatAllocation = function (allocation) {
      var days = {
        0 : 'Monday',
        1 : 'Tuesday',
        2 : 'Wednesday',
        3 : 'Thursday',
        4 : 'Friday',
        5 : 'Saturday',
        6 : 'Sunday'
      };
      return 'Period ' + (parseInt(allocation.periodIndex, 10) + 1) + ' - ' + days[allocation.dayIndex] +
        ': Allocated ' + allocation.after.subject + ' (' + allocation.after.teacher + ') in place of ' +
        allocation.before.subject + ' (' + allocation.before.teacher + ')';
    };

    $scope.find = function () {
      //one timetable each for one curriculum
      $scope.curriculums = Timetables.query();
        $scope.teachers = Teachers.query();
    };

    $scope.undo = function () {
      // Get the last allocation from undoStack
      var allocation = $scope.undoStack.pop();
      // Add it to the redoStack
      $scope.redoStack.push(allocation);
      // "Reverse" it to make it an allocationToUndo of the one pulled from history
      var allocationToUndo = {
        dayIndex    : allocation.dayIndex,
        periodIndex : allocation.periodIndex,
        before      : {
          subject : allocation.after.subject,
          teacher : allocation.after.teacher,
        },
        after       : {
          subject : allocation.before.subject,
          teacher : allocation.before.teacher,
        }
      };
      // Apply the allocationToUndo
      applyAllocation(allocationToUndo);
    };

    $scope.redo = function () {
      // Get the last allocation from redoStack
      var allocationToRedo = $scope.redoStack.pop();
      // Add it to the undoStack
      $scope.undoStack.push(allocationToRedo);
      // Apply this allocation
      applyAllocation(allocationToRedo);
    };

    $scope.onDropComplete = function (allocatedCourse, evt, dayIndex, periodIndex, isUndo) {
      // Code to check if there is a clash in the existing assignment
      // If yes, send clash as well to the server
      // if new allocation removes clash, set clash to false
      // in any case remove existing clash controller array
      var currentPeriod = extractPeriod(dayIndex, periodIndex);

      var allocatedSubject = allocatedCourse.code;
      var allocatedTeacher = allocatedCourse._teacher.code;

      if (currentPeriod.subject === allocatedSubject && currentPeriod.teacher === allocatedTeacher) {
        // No need to change anything
        return;
      }

      // Clear the redoStack now that we're adding a new operation to the history
      $scope.redoStack = [];

      // Create the allocation object
      var allocation = {
        dayIndex    : dayIndex,
        periodIndex : periodIndex,
        before      : {
          subject : currentPeriod.subject,
          teacher : currentPeriod.teacher,
        },
        after       : {
          subject : allocatedSubject,
          teacher : allocatedTeacher
        }
      };

      // Add this allocation to undoStack
      $scope.undoStack.push(allocation);

      // Apply the allocation
      applyAllocation(allocation);
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

    $scope.findClashes = function (clash, dayIndex, periodIndex) {
      if (clash === true) {
        console.log('clash for this element :' + clash);
        console.log('day for this element :' + dayIndex);
        console.log('period for this element :' + periodIndex);
        $http.post('/timetables/discoverClashes', {
          currentDay    : dayIndex,
          currentPeriod : extractPeriod(dayIndex, periodIndex),
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
