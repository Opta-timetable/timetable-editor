'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function () {
  // Init module configuration options
  var applicationModuleName = 'timetable';
  var applicationModuleVendorDependencies = [
    'ngResource', 'ngCookies', 'ngAnimate', 'ngTouch', 'ngSanitize', 'ui.router', 'ui.bootstrap', 'ui.utils',
    'ngDraggable', 'ngTableToCsv', 'ncy-angular-breadcrumb'
  ];

  // Add a new vertical module
  var registerModule = function (moduleName, dependencies) {
    // Create angular module
    angular.module(moduleName, dependencies || []);

    // Add the module to the AngularJS configuration file
    angular.module(applicationModuleName).requires.push(moduleName);
  };

  return {
    applicationModuleName               : applicationModuleName,
    applicationModuleVendorDependencies : applicationModuleVendorDependencies,
    registerModule                      : registerModule
  };
})();

'use strict';

//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider',
  function ($locationProvider) {
    $locationProvider.hashPrefix('!');
  }
]);

//Then define the init function for starting up the application
angular.element(document).ready(function () {
  //Fixing facebook bug with redirect
  if (window.location.hash === '#_=_') window.location.hash = '#!';

  // Fixing google bug with redirect
  if (window.location.href[window.location.href.length - 1] === '#' &&
      // for just the error url (origin + /#)
    (window.location.href.length - window.location.origin.length) === 2) {
    window.location.href = window.location.origin + '/#!';
  }

  //Then init the app
  angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('core');
'use strict';

// Use application configuration module to register a new module
ApplicationConfiguration.registerModule('courses');

'use strict';

// Use application configuration module to register a new module
ApplicationConfiguration.registerModule('timetables');

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('users');
'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {
    // Redirect to home view when route not found
    $urlRouterProvider.otherwise('/');

    // Home state routing
    $stateProvider.
      state('home', {
        url           : '/',
        templateUrl   : 'modules/core/views/home.client.view.html',
        ncyBreadcrumb : {
          label : 'Home'
        }
      });
  }
]);

'use strict';

angular.module('core').controller('FooterController', ['$scope', 'Version',
  function ($scope, Version) {
    $scope.version = Version.get();
  }
]);

'use strict';

angular.module('core').controller('HeaderController', ['$scope', 'Authentication', 'Menus',
  function ($scope, Authentication, Menus) {
    $scope.authentication = Authentication;
    $scope.isCollapsed = false;
    $scope.menu = Menus.getMenu('topbar');

    $scope.toggleCollapsibleMenu = function () {
      $scope.isCollapsed = !$scope.isCollapsed;
    };

    // Collapsing the menu after navigation
    $scope.$on('$stateChangeSuccess', function () {
      $scope.isCollapsed = false;
    });
  }
]);

'use strict';


angular.module('core').controller('HomeController', ['$scope', 'Authentication', 'Version',
  function ($scope, Authentication, Version) {
    // This provides Authentication context.
    $scope.authentication = Authentication;

    $scope.version = Version.get();
  }
]);

'use strict';

//Menu service used for managing  menus
angular.module('core').service('Menus', [

  function () {
    // Define a set of default roles
    this.defaultRoles = ['*'];

    // Define the menus object
    this.menus = {};

    // A private function for rendering decision
    var shouldRender = function (user) {
      if (user) {
        if (!!~this.roles.indexOf('*')) {
          return true;
        } else {
          for (var userRoleIndex in user.roles) {
            for (var roleIndex in this.roles) {
              if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
                return true;
              }
            }
          }
        }
      } else {
        return this.isPublic;
      }

      return false;
    };

    // Validate menu existance
    this.validateMenuExistance = function (menuId) {
      if (menuId && menuId.length) {
        if (this.menus[menuId]) {
          return true;
        } else {
          throw new Error('Menu does not exists');
        }
      } else {
        throw new Error('MenuId was not provided');
      }

      return false;
    };

    // Get the menu object by menu id
    this.getMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Return the menu object
      return this.menus[menuId];
    };

    // Add new menu object by menu id
    this.addMenu = function (menuId, isPublic, roles) {
      // Create the new menu
      this.menus[menuId] = {
        isPublic     : isPublic || false,
        roles        : roles || this.defaultRoles,
        items        : [],
        shouldRender : shouldRender
      };

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeMenu = function (menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Return the menu object
      delete this.menus[menuId];
    };

    // Add menu item object
    this.addMenuItem = function (menuId, menuItemTitle, menuItemURL, menuItemType, menuItemUIRoute, isPublic, roles, position) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Push new menu item
      this.menus[menuId].items.push({
        title         : menuItemTitle,
        link          : menuItemURL,
        menuItemType  : menuItemType || 'item',
        menuItemClass : menuItemType,
        uiRoute       : menuItemUIRoute || ('/' + menuItemURL),
        isPublic      : ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].isPublic : isPublic),
        roles         : ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].roles : roles),
        position      : position || 0,
        items         : [],
        shouldRender  : shouldRender
      });

      // Return the menu object
      return this.menus[menuId];
    };

    // Add submenu item object
    this.addSubMenuItem = function (menuId, rootMenuItemURL, menuItemTitle, menuItemURL, menuItemUIRoute, isPublic, roles, position) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].link === rootMenuItemURL) {
          // Push new submenu item
          this.menus[menuId].items[itemIndex].items.push({
            title        : menuItemTitle,
            link         : menuItemURL,
            uiRoute      : menuItemUIRoute || ('/' + menuItemURL),
            isPublic     : ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].items[itemIndex].isPublic : isPublic),
            roles        : ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].items[itemIndex].roles : roles),
            position     : position || 0,
            shouldRender : shouldRender
          });
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeMenuItem = function (menuId, menuItemURL) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].link === menuItemURL) {
          this.menus[menuId].items.splice(itemIndex, 1);
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeSubMenuItem = function (menuId, submenuItemURL) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
          if (this.menus[menuId].items[itemIndex].items[subitemIndex].link === submenuItemURL) {
            this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
          }
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    //Adding the topbar menu
    this.addMenu('topbar');
  }
]);

'use strict';

angular.module('core').factory('Version', ['$resource',
  function ($resource) {
    return $resource('version');
  }
]);


//'use strict';
//
//// Courses module config
//angular.module('courses').run(['Menus',
//  function (Menus) {
//    // Set top bar menu items
//    Menus.addMenuItem('topbar', 'Courses', 'courses', 'dropdown', '/courses(/create)?');
//    Menus.addSubMenuItem('topbar', 'courses', 'List Courses', 'courses');
//    Menus.addSubMenuItem('topbar', 'courses', 'New Course', 'courses/create');
//  }
//]);

'use strict';

// Setting up route
angular.module('courses').config(['$stateProvider',
  function ($stateProvider) {
    // Courses state routing
    $stateProvider.
      state('listCourses', {
        url           : '/courses',
        templateUrl   : 'modules/courses/views/list-courses.client.view.html',
        ncyBreadcrumb : {
          label  : 'Courses',
          parent : 'home'
        }
      }).
      state('createCourse', {
        url           : '/courses/create',
        templateUrl   : 'modules/courses/views/create-course.client.view.html',
        ncyBreadcrumb : {
          label  : 'Add Course',
          parent : 'listCourses'
        }
      }).
      state('viewCourse', {
        url           : '/courses/:courseId',
        templateUrl   : 'modules/courses/views/view-course.client.view.html',
        ncyBreadcrumb : {
          label  : 'Course',
          parent : 'listCourses'
        }
      }).
      state('editCourse', {
        url           : '/courses/:courseId/edit',
        templateUrl   : 'modules/courses/views/edit-course.client.view.html',
        ncyBreadcrumb : {
          label  : 'Edit Course',
          parent : 'viewCourse'
        }
      });
  }
]);

/*jshint unused: false */
'use strict';

angular.module('courses').controller('CoursesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Courses',
  function ($scope, $stateParams, $location, Authentication, Courses) {
    $scope.authentication = Authentication;

    $scope.create = function () {
      var course = new Courses({
        studentSize       : this.course.studentSize,
        minWorkingDaySize : this.course.minWorkingDaySize,
        lectureSize       : this.course.lectureSize,
        code              : this.course.code,
        courseID          : this.course.courseID,
        _teacher          : 0
      });
      course.$save(function (response) {
        $location.path('courses/' + response._id);

        $scope.course = {};
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.remove = function (course) {
      if (course) {
        course.$remove();

        for (var i in $scope.courses) {
          if ($scope.courses[i] === course) {
            $scope.courses.splice(i, 1);
          }
        }
      } else {
        $scope.course.$remove(function () {
          $location.path('courses');
        });
      }
    };

    $scope.update = function () {
      var course = $scope.course;

      course.$update(function () {
        $location.path('courses/' + course._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    $scope.find = function () {
      $scope.courses = Courses.query();
    };

    $scope.findOne = function () {
      $scope.course = Courses.get({
        courseId : $stateParams.courseId
      });
    };
  }
]);

'use strict';

angular.module('courses').factory('Courses', ['$resource',
  function ($resource) {
    return $resource('courses/:courseId', {
      courseId : '@_id'
    }, {
      update : {
        method : 'PUT'
      }
    });
  }
]);

'use strict';

// Timetables module config
angular.module('timetables').run(['Menus',
  function (Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', 'Timetables', 'timetables', 'item', '/timetables');
  }
]);

'use strict';

// Setting up route
angular.module('timetables').config(['$stateProvider',
  function ($stateProvider) {
    // Timetables state routing
    $stateProvider.
      state('listTimetables', {
        url           : '/timetables',
        templateUrl   : 'modules/timetables/views/list-timetables.client.view.html',
        ncyBreadcrumb : {
          label  : 'Timetables',
          parent : 'home'
        }
      }).
      state('viewTimetable', {
        url           : '/timetables/:curriculumId',
        templateUrl   : 'modules/timetables/views/view-timetable.client.view.html',
        ncyBreadcrumb : {
          label  : 'Class Timetable',
          parent : 'listTimetables'
        }
      }).
      state('viewTeacherTimetable', {
        url           : '/timetables/teachers/:_id',
        templateUrl   : 'modules/timetables/views/view-teacher-timetable.client.view.html',
        ncyBreadcrumb : {
          label  : 'Teacher Timetable',
          parent : 'listTimetables'
        }
      }).
      state('viewDayTimetable', {
        url           : '/timetables/days/:dayIndex',
        templateUrl   : 'modules/timetables/views/view-day-timetable.client.view.html',
        ncyBreadcrumb : {
          label  : 'Timetable for Day',
          parent : 'listTimetables'
        }
      }).
      state('editTimetable', {
        url           : '/timetables/edit/:curriculumId',
        templateUrl   : 'modules/timetables/views/edit-timetable.client.view.html',
        ncyBreadcrumb : {
          label  : 'Edit Timetable',
          parent : 'viewTimetable'
        }
      });
  }
]);

'use strict';
angular.module('timetables').controller('ModalInstanceCtrl', ["$scope", "$modalInstance", "teachers", "subjectCode", function ($scope, $modalInstance, teachers, subjectCode) {

  $scope.teachers = teachers;
  $scope.subjectCode = subjectCode;
  $scope.selectedTeacher = {};
  $scope.newTeacher = false;

  $scope.selectTeacher = function(teacher){
    $scope.newTeacher = false;
    $scope.selectedTeacher = teacher;
  };

  $scope.ok = function () {
    $modalInstance.close({selectedTeacher: $scope.selectedTeacher, isNew: $scope.newTeacher});
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

  $scope.createNewTeacher = function () {
    $scope.newTeacher = true;
    $scope.selectedTeacher = {};
  };

}]);

/*jshint unused: false */
'use strict';

angular.module('timetables').controller('DayTimetableController', ['$http', '$scope', '$stateParams', '$location', 'Authentication', 'Days', 'Teachers',
  function ($http, $scope, $stateParams, $location, Authentication, Days, Teachers) {
    $scope.authentication = Authentication;

    $scope.formatSubjectTeacher = function (subject, teacher) {
      if (subject && teacher) {
        return subject + ', ' + teacher;
      }
      return '';
    };

    $scope.unassignedTeachersForPeriod = [];

    function getAllTeachers(){
      var allTeachers = [];
      //Not initialised yet. Let's do it now
      $scope.teachers.forEach(function(teacher){
        allTeachers.push(teacher.code);
      });
      return allTeachers;
    }

    function findAndRemoveFromArray(array, val){
      var index = array.indexOf(val);
      if (index > -1){
        return array.splice(index, 1);
      }
      return array;
    }

    function prepareUnassignedTeachersForPeriods(){
      if ($scope.timetable.timetableForDay && $scope.timetable.timetableForDay.length > 0 &&
        $scope.teachers && $scope.teachers.length > 0) {
        var timetableForDay = $scope.timetable.timetableForDay;
        for (var i=0; i < timetableForDay[0].days.periods.length; i++){
          // For each Period in the day get all teachers first and then ...
          // Iterate through timetable and remove the assigned teachers
          var unassignedTeachers = getAllTeachers();
          for (var j = 0; j < timetableForDay.length; j++){
            findAndRemoveFromArray(unassignedTeachers, timetableForDay[j].days.periods[i].teacher);
          }
          $scope.unassignedTeachersForPeriod.push(unassignedTeachers);
        }
      }
    }

    $scope.formatUnassignedTeachers = function(period){
        return $scope.unassignedTeachersForPeriod[period].join(', ');
    };

    $scope.findOne = function () {
      $scope.timetable = Days.get({
        dayIndex : $stateParams.dayIndex
      });
      $scope.teachers = Teachers.query();
    };

    //Due to the checks there, only one of the below will trigger the prepareUnassignedTeachersForPeriods Functionality.
    $scope.$watch('timetable.timetableForDay.length > 0', prepareUnassignedTeachersForPeriods);
    $scope.$watch('teachers.length > 0', prepareUnassignedTeachersForPeriods);
  }
]);

/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TeacherTimetableController', ['$http', '$scope', '$stateParams', '$location', 'Authentication', 'Timetables', 'Teachers',
  function ($http, $scope, $stateParams, $location, Authentication, Timetables, Teachers) {
    $scope.authentication = Authentication;

    $scope.formatClassSubject = function (period) {
      var allocationStr = '';
      if (period.curriculum && period.subject) {
        allocationStr = period.curriculum + ', ' + period.subject;
      }
      if (period.clash){
        for (var i = 0; i < period.clashes.length; i++){
          allocationStr = allocationStr + ', [' + period.clashes[i].clashInCurriculum + ', ' + period.clashes[i].clashInSubject + ']';
        }
      }
      return allocationStr;
    };

    $scope.findOne = function () {
      $scope.timetableForTeacher = Teachers.get({
        _id : $stateParams._id
      });

    };
  }
]);

/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TimetablesController', ['$http', '$scope', '$filter', '$stateParams', '$location', '$modal', 'Authentication', 'Timetables', 'Teachers',
  function ($http, $scope, $filter, $stateParams, $location, $modal, Authentication, Timetables, Teachers) {
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
      $http.post('/timetables/modifyPeriodAllocation', {
        currentDay      : dayIndex,
        currentPeriod   : extractPeriod(dayIndex, periodIndex),
        allocatedCourse : allocatedCourse,
        clashesToUpdate   : currentClashes
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
      }
    });

    $scope.find = function () {
      //one timetable each for one curriculum
      $scope.curriculums = Timetables.query();
      $scope.teachers = Teachers.query();
      //The following should eventually come from a configuration tied to the user and school
      $scope.workingDays = [{dayName:'Monday', dayIndex:0},
        {dayName:'Tuesday', dayIndex:1},
        {dayName:'Wednesday', dayIndex:2},
        {dayName:'Thursday', dayIndex:3},
        {dayName:'Friday', dayIndex:4}];
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

    $scope.getClashLink = function (dayIndex, periodIndex, curriculumReference) {
      var clashesInScope;
      if (curriculumReference !== undefined){
        clashesInScope = extractClashes(dayIndex, periodIndex, curriculumReference);
      }else{
        clashesInScope = extractClashes(dayIndex, periodIndex);
      }
      if (clashesInScope.length > 0) { //TODO getClash link in the view doesn't have a provision to display multiple links. A popover would look good.
        return '#!/timetables/' + clashesInScope[0].curriculumReference;
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
      $http.post('/timetables/collectStats', {
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
      $http.post('/timetables/changeTeacherAssignment', {
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
        updateTeacherForSubject(subjectCode, response._id, response.code);
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
            updateTeacherForSubject($scope.subjectCode, $scope.selectedTeacher._id, $scope.selectedTeacher.code);
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

'use strict';

angular.module('timetables').filter('slice', [
  function () {
    return function (arr, start, end) {
      return arr.slice(start, end);
    };
  }
]);

'use strict';

angular.module('timetables').factory('Timetables', ['$resource',
  function ($resource) {
    return $resource('timetables/:curriculumId', {
      curriculumId : '@curriculumId'
    }, {'update' : {method : 'PUT'}});
  }
]);

angular.module('timetables').factory('Teachers', ['$resource',
  function ($resource) {
    return $resource('timetables/teachers/:_id', {
      _id : '@_id'
    }, {'update' : {method : 'PUT'}});
  }
]);

angular.module('timetables').factory('Days', ['$resource',
  function ($resource) {
    return $resource('timetables/days/:dayIndex', {
      dayIndex : '@dayIndex'
    }, {'update' : {method : 'PUT'}});
  }
]);

'use strict';

// Config HTTP Error Handling
angular.module('users').config(['$httpProvider',
  function ($httpProvider) {
    // Set the httpProvider "not authorized" interceptor
    $httpProvider.interceptors.push(['$q', '$location', 'Authentication',
      function ($q, $location, Authentication) {
        return {
          responseError : function (rejection) {
            switch (rejection.status) {
              case 401:
                // Deauthenticate the global user
                Authentication.user = null;

                // Redirect to signin page
                $location.path('signin');
                break;
              case 403:
                // Add unauthorized behaviour
                break;
            }

            return $q.reject(rejection);
          }
        };
      }
    ]);
  }
]);

'use strict';

// Setting up route
angular.module('users').config(['$stateProvider',
  function ($stateProvider) {
    // Users state routing
    $stateProvider.
      state('profile', {
        url         : '/settings/profile',
        templateUrl : 'modules/users/views/settings/edit-profile.client.view.html'
      }).
      state('password', {
        url         : '/settings/password',
        templateUrl : 'modules/users/views/settings/change-password.client.view.html'
      }).
      state('accounts', {
        url         : '/settings/accounts',
        templateUrl : 'modules/users/views/settings/social-accounts.client.view.html'
      }).
      state('signup', {
        url         : '/signup',
        templateUrl : 'modules/users/views/authentication/signup.client.view.html'
      }).
      state('signin', {
        url         : '/signin',
        templateUrl : 'modules/users/views/authentication/signin.client.view.html'
      }).
      state('forgot', {
        url         : '/password/forgot',
        templateUrl : 'modules/users/views/password/forgot-password.client.view.html'
      }).
      state('reset-invalid', {
        url         : '/password/reset/invalid',
        templateUrl : 'modules/users/views/password/reset-password-invalid.client.view.html'
      }).
      state('reset-success', {
        url         : '/password/reset/success',
        templateUrl : 'modules/users/views/password/reset-password-success.client.view.html'
      }).
      state('reset', {
        url         : '/password/reset/:token',
        templateUrl : 'modules/users/views/password/reset-password.client.view.html'
      });
  }
]);

'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$http', '$location', 'Authentication',
  function ($scope, $http, $location, Authentication) {
    $scope.authentication = Authentication;

    // If user is signed in then redirect back home
    if ($scope.authentication.user) $location.path('/');

    $scope.signup = function () {
      $http.post('/auth/signup', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the index page
        $location.path('/');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };

    $scope.signin = function () {
      $http.post('/auth/signin', $scope.credentials).success(function (response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the index page
        $location.path('/');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('PasswordController', ['$scope', '$stateParams', '$http', '$location', 'Authentication',
  function ($scope, $stateParams, $http, $location, Authentication) {
    $scope.authentication = Authentication;

    //If user is signed in then redirect back home
    if ($scope.authentication.user) $location.path('/');

    // Submit forgotten password account id
    $scope.askForPasswordReset = function () {
      $scope.success = $scope.error = null;

      $http.post('/auth/forgot', $scope.credentials).success(function (response) {
        // Show user success message and clear form
        $scope.credentials = null;
        $scope.success = response.message;

      }).error(function (response) {
        // Show user error message and clear form
        $scope.credentials = null;
        $scope.error = response.message;
      });
    };

    // Change user password
    $scope.resetUserPassword = function () {
      $scope.success = $scope.error = null;

      $http.post('/auth/reset/' + $stateParams.token, $scope.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.passwordDetails = null;

        // Attach user profile
        Authentication.user = response;

        // And redirect to the index page
        $location.path('/password/reset/success');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);

'use strict';

angular.module('users').controller('SettingsController', ['$scope', '$http', '$location', 'Users', 'Authentication',
  function ($scope, $http, $location, Users, Authentication) {
    $scope.user = Authentication.user;

    // If user is not signed in then redirect back home
    if (!$scope.user) $location.path('/');

    // Check if there are additional accounts
    $scope.hasConnectedAdditionalSocialAccounts = function (provider) {
      for (var i in $scope.user.additionalProvidersData) {
        return true;
      }

      return false;
    };

    // Check if provider is already in use with current user
    $scope.isConnectedSocialAccount = function (provider) {
      return $scope.user.provider === provider || ($scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider]);
    };

    // Remove a user social account
    $scope.removeUserSocialAccount = function (provider) {
      $scope.success = $scope.error = null;

      $http.delete('/users/accounts', {
        params : {
          provider : provider
        }
      }).success(function (response) {
        // If successful show success message and clear form
        $scope.success = true;
        $scope.user = Authentication.user = response;
      }).error(function (response) {
        $scope.error = response.message;
      });
    };

    // Update a user profile
    $scope.updateUserProfile = function (isValid) {
      if (isValid) {
        $scope.success = $scope.error = null;
        var user = new Users($scope.user);

        user.$update(function (response) {
          $scope.success = true;
          Authentication.user = response;
        }, function (response) {
          $scope.error = response.data.message;
        });
      } else {
        $scope.submitted = true;
      }
    };

    // Change user password
    $scope.changeUserPassword = function () {
      $scope.success = $scope.error = null;

      $http.post('/users/password', $scope.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.success = true;
        $scope.passwordDetails = null;
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);

'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', [
  function () {
    var _this = this;

    _this._data = {
      user : window.user
    };

    return _this._data;
  }
]);

'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource',
  function ($resource) {
    return $resource('users', {}, {
      update : {
        method : 'PUT'
      }
    });
  }
]);
