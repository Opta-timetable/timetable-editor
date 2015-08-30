/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TimetablesController', ['$http', '$scope', '$filter', '$stateParams', '$location', '$modal', 'Authentication', 'Timetables', 'Teachers', 'TimetableForCurriculum', 'SpecIdHolder',
  function ($http, $scope, $filter, $stateParams, $location, $modal, Authentication, Timetables, Teachers, TimetableForCurriculum, SpecIdHolder) {
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

    function assignBackgroundColorForSubjects(){
      //Assume a class won't have more than 16 colors
      //We might need to add a bg-color property to the cell in the timetable itself so that the same color remains across refreshes as well
      var colors= ['plum', 'orchid', 'coral', 'teal', 'bisque', 'peru',
      'thistle', 'olive', 'pink', 'sienna', 'ivory', 'linen', 'orange', 'gold', 'purple', 'crimson'];
      $scope.backgroundColorForSubjects = {};
      var index = 0;
      $scope.timetableForCurriculum.courses.forEach(function (course){
        $scope.backgroundColorForSubjects[course.code] = colors[index];
        index++;
      });
    }

    $scope.getBackgroundColorForSubject = function (subject){
      return $scope.backgroundColorForSubjects[subject];
    };

    function extractClashes(dayIndex, periodIndex, curriculumReference) {
          // Array.filter -> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
          // Filter returns an array of matches -
          return $scope.clashes.filter(function (clash) {
            if (curriculumReference !== undefined){
              return clash.days.dayIndex === dayIndex && clash.days.periods.index === parseInt(periodIndex) && clash.curriculumReference === curriculumReference;
            }else{
              return clash.days.dayIndex === dayIndex && clash.days.periods.index === parseInt(periodIndex);
            }
          });
        }

    function extractCourse(dayIndex, periodIndex) {
      var period = extractPeriod(dayIndex, periodIndex);
      return $scope.timetableForCurriculum.courses.filter(function (course) {
        return course._teacher.code === period.teacher && course.code === period.subject;
      })[0];
    }

    function popClashFromLocalList(dayIndex, periodIndex) {
      var clashesToUpdate = [];
      var currentPeriod = extractPeriod(dayIndex, periodIndex);

      if (currentPeriod.clash) {

        clashesToUpdate = extractClashes(dayIndex, periodIndex);
        // remove this clash from the local array (in the controller).
        // It will get updated with the new one, if any
        clashesToUpdate.forEach(function(clashToUpdate){
          $scope.clashes.splice($scope.clashes.indexOf(clashToUpdate), 1);
        });

      }

      console.log('clash to update is ' + JSON.stringify(clashesToUpdate));

      return clashesToUpdate;
    }

    function updateAllocation(dayIndex, periodIndex, allocatedCourse, currentClashes) {
      $http.post('/timetables/' + $scope.specId + '/modifyPeriodAllocation', {
        currentDay      : dayIndex,
        currentPeriod   : extractPeriod(dayIndex, periodIndex),
        allocatedCourse : allocatedCourse,
        clashesToUpdate : currentClashes,
        specReference   : $scope.specId
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
      var clashesToUpdate = popClashFromLocalList(dayIndex, periodIndex);

      // If there are 2 or more existing clashes, don't update clashes in the db because the clashes would still exist in the other classes
      if (clashesToUpdate.length > 1){
        clashesToUpdate = [];
      }
      // call the API to update the period allocation setting up callbacks
      updateAllocation(dayIndex, periodIndex, allocatedCourse, clashesToUpdate);

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
      $scope.subjectColumns = []; //Reset when there is a change. For now, change means a teacher allocation change for a subject
      if ($scope.timetableForCurriculum && $scope.timetableForCurriculum.courses) {
        // Split subjects into multiple columns with up to SUBJECT_ROWS_PER_COLUMN items in a row
        $scope.columnCount = Math.ceil($scope.timetableForCurriculum.courses.length / SUBJECT_ROWS_PER_COLUMN);
        for (var i = 0; i < $scope.timetableForCurriculum.courses.length; i += SUBJECT_ROWS_PER_COLUMN) {
          var column = {start : i, end : Math.min(i + SUBJECT_ROWS_PER_COLUMN, $scope.timetableForCurriculum.courses.length)};
          $scope.subjectColumns.push(column);
        }
        //Set the bg-colors
        assignBackgroundColorForSubjects();
      }
    });

    $scope.list = function() {
      $scope.allTimetables = Timetables.query();
    //Get all the generated timetables
    };

    $scope.find = function () {
      //pick specId in context
      $scope.specId = $stateParams.specId;
      //Set specId into Holder so that other controllers can access it
      SpecIdHolder.setSpecId($stateParams.specId);
      //one timetable each for one curriculum
      $scope.curriculums = Timetables.query({
        specId : $stateParams.specId
      });
      $scope.teachers = Teachers.query({
        specId : $stateParams.specId
      });
      //The following should eventually come from a configuration tied to the user and school
      $scope.workingDays = [{dayName:'Monday', dayIndex:0},
        {dayName:'Tuesday', dayIndex:1},
        {dayName:'Wednesday', dayIndex:2},
        {dayName:'Thursday', dayIndex:3},
        {dayName:'Friday', dayIndex:4}];
    };

    $scope.findOne = function () {
      $scope.timetableForCurriculum = TimetableForCurriculum.get({
        specId : $stateParams.specId,
        curriculumId : $stateParams.curriculumId
      });
      $scope.specId = $stateParams.specId;
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
        $location.path('timetables/' + $scope.specId + '/curriculum/' + $stateParams.curriculumId);
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
        $http.post('/timetables/' + $stateParams.specId + '/discoverClashes', {
          currentDay    : dayIndex,
          currentPeriod : extractPeriod(dayIndex, periodIndex),
          curriculumId  : $stateParams.curriculumId,
          specId        : $stateParams.specId
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

    $scope.getClashLink = function (dayIndex, periodIndex, curriculumReference) {
      var clashesInScope;
      if (curriculumReference !== undefined){
        clashesInScope = extractClashes(dayIndex, periodIndex, curriculumReference);
      }else{
        clashesInScope = extractClashes(dayIndex, periodIndex);
      }
      if (clashesInScope.length > 0) { //TODO getClash link in the view doesn't have a provision to display multiple links. A popover would look good.
        return '#!/timetables/' + $stateParams.specId + '/curriculum/' + clashesInScope[0].curriculumReference;
      }
      return undefined;
    };

    $scope.hasHighlight = function (clash, dayIndex, periodIndex) {
      if (clash) {
        var clashInScope = extractClashes(dayIndex, periodIndex);
        return clashInScope.length > 0 ? clashInScope.highlight : false;
      }
    };

    $scope.highlight = function (clash, dayIndex, periodIndex) {
      var course = extractCourse(dayIndex, periodIndex);
      if (course) {
        course.highlight = true;
        if (clash) {
          var clashesInScope = extractClashes(dayIndex, periodIndex);
          if (clashesInScope.length > 0) {
            clashesInScope.forEach(function(clashInScope){
              clashInScope.highlight = true;
            });
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
          var clashesInScope = extractClashes(dayIndex, periodIndex);
          if (clashesInScope.length > 0) {
            clashesInScope.forEach(function(clashInScope){
              clashInScope.highlight = false;
            });
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
          {name : 'Periods in a week for ' + teacherCode + ' in this Class', value : teacherAllocationInClassCount},
          {name : 'Number of ' + subjectCode + ' periods in a week for this Class', value : subjectAllocationCount},
          {name : 'Total periods in a week for ' + teacherCode, value : '-'}
        ],
        teacherCode : teacherCode,
        subjectCode : subjectCode
      };
      //Collect Teacher totals from server
      $http.post('/timetables/' + $stateParams.specId + '/collectStats', {
        teacherCode : teacherCode
      })
        .success(function (data, status, headers, config) {
          $scope.stats.data[2].value = data.teacherStats.totalAllocation;
        })
        .error(function (data, status, headers, config) {

        });
      $scope.selectedCourseForStats = course;
    };

    function extractClashesForTeacher(teacher){
      return $scope.clashes.filter(function (clash) {
        return clash.days.periods.teacher === teacher;
      });
    }

    function popAllClashesForTeacherFromLocalList(teacher) {
      var clashesToUpdate = [];
      clashesToUpdate = extractClashesForTeacher(teacher);
      // remove all the clashes
      clashesToUpdate.forEach(function (clash){
        $scope.clashes.splice($scope.clashes.indexOf(clash), 1);
      });
      console.log('clashes to update is ' + JSON.stringify(clashesToUpdate));
      return clashesToUpdate;
    }

    function updateTeacherForSubject(subjectCode, newTeacherID, newTeacherCode){
      // get the clashes for the current teacher, if any after removing it from the local list
      var clashesToUpdate = popAllClashesForTeacherFromLocalList($scope.teacherCode);
      $http.post('/timetables/' + $scope.specId + '/changeTeacherAssignment', {
        teacherReference : newTeacherID,
        teacherCode : newTeacherCode,
        subjectCode : subjectCode,
        curriculumReference : $scope.timetableForCurriculum.timetable.curriculumReference,
        clashesToUpdate : clashesToUpdate
      })
        .success(function (data, status, headers, config) {
          console.log('Teacher Changed successfully');
          //update courses and timetable by picking afresh from the server
          $scope.timetableForCurriculum = null;
          $scope.findOne();
          //Collapse the stats viewer
          $scope.stats = null;
        })
        .error(function (data, status, headers, config) {

        });
    }

    function createNewTeacherAndUpdateSubject(subjectCode, newTeacherCode){
      console.log('Inside CreateNewTeacherAndUpdateSubject');
      var teacher = new Teachers({
        teacherID : ($scope.teachers.length+1).toString(),
        code      : newTeacherCode
      });
      teacher.$save(function (response) {
        console.log('Created teacher %j', response);
        //Call update function using the new teacher
        updateTeacherForSubject(subjectCode, response.id, response.code);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    }

    $scope.displayTeacherAssignmentModal = function(course, size){
      $scope.subjectCode = course.code;
      $scope.teacherCode = course._teacher.code;
      $scope.teachers = Teachers.query();
      $scope.selectedTeacher = null;
      var modalInstance = $modal.open({
        animation: true,
        templateUrl: 'modal.client.view.html',
        controller: 'ModalInstanceCtrl',
        size: size,
        resolve: {
          teachers: function () {
            return $scope.teachers;
          },
          subjectCode: function () {
            return $scope.subjectCode;
          }
        }
      });

      modalInstance.result.then(function (result) {
        console.log('newTeacher flag is %j', result.isNew);
        $scope.selectedTeacher = result.selectedTeacher;
        if (result.isNew !== true){
          //Assignment using an existing teacher
          console.info('The user has selected %j', $scope.selectedTeacher);
          if ($scope.selectedTeacher.code !== $scope.teacherCode){
            updateTeacherForSubject($scope.subjectCode, $scope.selectedTeacher.id, $scope.selectedTeacher.code);
          }
        }else{
          //New teacher being created
          console.info('The user wants to create a new teacher with code %j', $scope.selectedTeacher.code);
          createNewTeacherAndUpdateSubject($scope.subjectCode, $scope.selectedTeacher.code);
        }

      }, function () {
        console.info('Modal dismissed at: ' + new Date());
      });

    };
  }
]);
