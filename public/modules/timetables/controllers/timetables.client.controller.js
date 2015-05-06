/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TimetablesController', ['$http', '$scope', '$filter', '$stateParams', '$location', 'Authentication', 'Timetables', 'Teachers',
  function ($http, $scope, $filter, $stateParams, $location, Authentication, Timetables, Teachers) {
    var SUBJECT_ROWS_PER_COLUMN = 8;

    $scope.authentication = Authentication;
    $scope.clashes = [];
    $scope.history = [];
    $scope.undoStack = [];
    $scope.redoStack = [];
    $scope.subjectColumns = [];

    function extractPeriod(dayIndex, periodIndex) {
      var dayIndexAsInt = (typeof dayIndex === 'number') ? dayIndex : parseInt(dayIndex, 10);
      var periodIndexAsInt = typeof periodIndex === 'number' ? periodIndex : parseInt(periodIndex, 10);
      return $scope.timetableForCurriculum.timetable.days[dayIndexAsInt].periods[periodIndexAsInt];
    }

    function extractClash(dayIndex, periodIndex) {
      // Array.filter -> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
      // Filter returns an array of matches -
      return $scope.clashes.filter(function (clash) {
        return clash.days.dayIndex === dayIndex && clash.days.periods.index === parseInt(periodIndex);
      })[0];
    }

    function extractCourse(dayIndex, periodIndex) {
      var period = extractPeriod(dayIndex, periodIndex);
      return $scope.timetableForCurriculum.courses.filter(function (course) {
        return course._teacher.code === period.teacher && course.code === period.subject;
      })[0];
    }

    function popClashFromLocalList(dayIndex, periodIndex) {
      var clashToUpdate = {};
      var currentPeriod = extractPeriod(dayIndex, periodIndex);

      if (currentPeriod.clash) {

        clashToUpdate = extractClash(dayIndex, periodIndex);

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

      // Add allocation to history along with a timestamp
      allocation.timestamp = Date.now();
      $scope.history.unshift(allocation);
    }

    function createAndApplyAllocation(dayIndex, periodIndex, allocatedSubject, allocatedTeacher) {
      var currentPeriod = extractPeriod(dayIndex, periodIndex);

      if (!(currentPeriod.subject === allocatedSubject && currentPeriod.teacher === allocatedTeacher)) {
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

        //If stats were being displayed for any class
        if ($scope.selectedCourseForStats) {
          $scope.collectStats($scope.selectedCourseForStats);
        }
      }
    }

    $scope.$watch('timetableForCurriculum.courses', function () {
      // Thanks to the great SO answer that explains Angular's digest cycle, $watch and $apply
      // http://stackoverflow.com/a/15113029/218882
      if ($scope.timetableForCurriculum && $scope.timetableForCurriculum.courses) {
        // Split subjects into multiple columns with up to SUBJECT_ROWS_PER_COLUMN items in a row
        $scope.columnCount = Math.ceil($scope.timetableForCurriculum.courses.length / SUBJECT_ROWS_PER_COLUMN);
        for (var i = 0; i < $scope.timetableForCurriculum.courses.length; i += SUBJECT_ROWS_PER_COLUMN) {
          var column = {start : i, end : Math.min(i + SUBJECT_ROWS_PER_COLUMN, $scope.timetableForCurriculum.courses.length)};
          $scope.subjectColumns.push(column);
        }
      }
    });

    $scope.find = function () {
      //one timetable each for one curriculum
      $scope.curriculums = Timetables.query();
      $scope.teachers = Teachers.query();
    };

    $scope.findOne = function () {
      $scope.timetableForCurriculum = Timetables.get({
        curriculumId : $stateParams.curriculumId
      });
    };

    $scope.formatAllocationHistory = function (allocation) {
      var days = {
        0 : 'Monday',
        1 : 'Tuesday',
        2 : 'Wednesday',
        3 : 'Thursday',
        4 : 'Friday',
        5 : 'Saturday',
        6 : 'Sunday'
      };
      return $filter('date')(allocation.timestamp, 'short') + ': Period ' + (parseInt(allocation.periodIndex, 10) + 1) + ' - ' + days[allocation.dayIndex] +
        ': Allocated ' + allocation.after.subject + ' (' + allocation.after.teacher + ') in place of ' +
        allocation.before.subject + ' (' + allocation.before.teacher + ')';
    };

    $scope.formatClash = function (clash) {
      return clash.curriculumCode + ', ' + clash.days.periods.teacher + ', ' +
        clash.days.dayOfWeek + ', Period-' + (clash.days.periods.index + 1);
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

    $scope.onDropComplete = function (allocatedCourse, evt, dayIndex, periodIndex, isUndo) {
      // Code to check if there is a clash in the existing assignment
      // If yes, send clash as well to the server
      // if new allocation removes clash, set clash to false
      // in any case remove existing clash controller array
      var allocatedSubject = allocatedCourse.code;
      var allocatedTeacher = allocatedCourse._teacher.code;
      createAndApplyAllocation(dayIndex, periodIndex, allocatedSubject, allocatedTeacher);
    };

    $scope.removeAllocation = function (dayIndex, periodIndex) {
      //Fix issue #10
      var period = extractPeriod(dayIndex, periodIndex);
      $scope.unHighlight(period.clash, dayIndex, periodIndex);
      createAndApplyAllocation(dayIndex, periodIndex, '', '');
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

    $scope.getClashLink = function (dayIndex, periodIndex) {
      var clashInScope = extractClash(dayIndex, periodIndex);
      if (clashInScope) {
        return '#!/timetables/' + clashInScope.curriculumReference;
      }
      return undefined;
    };

    $scope.hasHighlight = function (clash, dayIndex, periodIndex) {
      if (clash) {
        var clashInScope = extractClash(dayIndex, periodIndex);
        return clashInScope ? clashInScope.highlight : false;
      }
    };

    $scope.highlight = function (clash, dayIndex, periodIndex) {
      var course = extractCourse(dayIndex, periodIndex);
      if (course) {
        course.highlight = true;
        if (clash) {
          var clashInScope = extractClash(dayIndex, periodIndex);
          if (clashInScope) {
            clashInScope.highlight = true;
            course.clashHighlight = true;
          }
        }
      }
    };

    $scope.unHighlight = function (clash, dayIndex, periodIndex) {
      var course = extractCourse(dayIndex, periodIndex);
      if (course) {
        course.highlight = false;
        if (clash) {
          var clashInScope = extractClash(dayIndex, periodIndex);
          if (clashInScope) {
            clashInScope.highlight = false;
            course.clashHighlight = false;
          }
        }
      }
    };

    $scope.highlightPeriods = function (subject) {
      $scope.timetableForCurriculum.timetable.days.forEach(function (day) {
        day.periods.forEach(function (period) {
          if (period.subject === subject) {
            extractPeriod(day.dayIndex, period.index).highlightPeriod = true;
          }
        });
      });
    };

    $scope.unHighlightPeriods = function (course) {
      $scope.timetableForCurriculum.timetable.days.forEach(function (day) {
        day.periods.forEach(function (period) {
          extractPeriod(day.dayIndex, period.index).highlightPeriod = false;
        });
      });
    };

    $scope.collectStats = function (course) {
      var subjectCode = course.code;
      var teacherCode = course._teacher.code;
      var subjectAllocationCount = 0;
      var teacherAllocationInClassCount = 0;
      //Calculate subject allocation count using timetable
      $scope.timetableForCurriculum.timetable.days.forEach(function (day) {
        day.periods.forEach(function (period) {
          if (period.subject === subjectCode) {
            subjectAllocationCount++;
          }
          if (period.teacher === teacherCode) {
            teacherAllocationInClassCount++;
          }
        });
      });
      $scope.stats = {
        header : 'Stats for ' + teacherCode + ' and ' + subjectCode,
        data   : [
          {name : 'Periods in a week for ' + teacherCode, value : teacherAllocationInClassCount},
          {name : 'Number of ' + subjectCode + ' periods in a week', value : subjectAllocationCount},
          {name : 'Total period in a week for ' + teacherCode, value : 'TODO'}
        ]
      };
      $scope.selectedCourseForStats = course;
    };

  }
]);
