'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function () {
  // Init module configuration options
  var applicationModuleName = 'timetable';
  var applicationModuleVendorDependencies = [
    'ngResource', 'ngCookies', 'ngAnimate', 'ngTouch', 'ngSanitize', 'ui.router', 'ui.bootstrap', 'ui.utils',
    'ngDraggable', 'ngTableToCsv', 'ncy-angular-breadcrumb', 'ngFileUpload', 'multi-select'
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

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('curriculums');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('schools');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('sections');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('specs');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('subjects');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('teachers');
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
      }).
      state('generateTimetable', {
        url           : '/generate',
        templateUrl   : 'modules/core/views/generate.client.view.html',
        ncyBreadcrumb : {
          label  : 'Generate Timetable',
          parent : 'home'
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


angular.module('core').controller('HomeController', ['$scope', '$http', 'Authentication', 'Version',
  function ($scope, $http, Authentication, Version) {
    // This provides Authentication context.
    $scope.authentication = Authentication;

    $scope.version = Version.get();

    $scope.upload = function(){
      $http.post('/upload')
        .success(function (data, status, headers, config) {
          console.log('Upload posted successfully');
        })
        .error(function (data, status, headers, config) {
          console.log('upload failed');
        });
    };
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


'use strict';

// Courses module config
angular.module('courses').run(['Menus',
  function (Menus) {
    // Set top bar menu items
    //Hiding Courses as it is "internal"
    //Menus.addMenuItem('topbar', 'Courses', 'courses', 'dropdown', '/courses(/create)?');
    //Menus.addSubMenuItem('topbar', 'courses', 'List Courses', 'courses');
    //Menus.addSubMenuItem('topbar', 'courses', 'New Course', 'courses/create');
  }
]);

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

// Configuring the Articles module
angular.module('curriculums').run(['Menus',
	function(Menus) {
		// Set top bar menu items
    //Hiding "Curriculums" as it is internal
		//Menus.addMenuItem('topbar', 'Curriculums', 'curriculums', 'dropdown', '/curriculums(/create)?');
		//Menus.addSubMenuItem('topbar', 'curriculums', 'List Curriculums', 'curriculums');
		//Menus.addSubMenuItem('topbar', 'curriculums', 'New Curriculum', 'curriculums/create');
	}
]);

'use strict';

//Setting up route
angular.module('curriculums').config(['$stateProvider',
	function($stateProvider) {
		// Curriculums state routing
		$stateProvider.
		state('listCurriculums', {
			url: '/curriculums',
			templateUrl: 'modules/curriculums/views/list-curriculums.client.view.html'
		}).
		state('createCurriculum', {
			url: '/curriculums/create',
			templateUrl: 'modules/curriculums/views/create-curriculum.client.view.html'
		}).
		state('viewCurriculum', {
			url: '/curriculums/:curriculumId',
			templateUrl: 'modules/curriculums/views/view-curriculum.client.view.html'
		}).
		state('editCurriculum', {
			url: '/curriculums/:curriculumId/edit',
			templateUrl: 'modules/curriculums/views/edit-curriculum.client.view.html'
		});
	}
]);
'use strict';

// Curriculums controller
angular.module('curriculums').controller('CurriculumsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Curriculums',
	function($scope, $stateParams, $location, Authentication, Curriculums) {
		$scope.authentication = Authentication;

		// Create new Curriculum
		$scope.create = function() {
			// Create new Curriculum object
			var curriculum = new Curriculums ({
				name: this.name
			});

			// Redirect after save
			curriculum.$save(function(response) {
				$location.path('curriculums/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Curriculum
		$scope.remove = function(curriculum) {
			if ( curriculum ) { 
				curriculum.$remove();

				for (var i in $scope.curriculums) {
					if ($scope.curriculums [i] === curriculum) {
						$scope.curriculums.splice(i, 1);
					}
				}
			} else {
				$scope.curriculum.$remove(function() {
					$location.path('curriculums');
				});
			}
		};

		// Update existing Curriculum
		$scope.update = function() {
			var curriculum = $scope.curriculum;

			curriculum.$update(function() {
				$location.path('curriculums/' + curriculum._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Curriculums
		$scope.find = function() {
			$scope.curriculums = Curriculums.query();
		};

		// Find existing Curriculum
		$scope.findOne = function() {
			$scope.curriculum = Curriculums.get({ 
				curriculumId: $stateParams.curriculumId
			});
		};
	}
]);
'use strict';

//Curriculums service used to communicate Curriculums REST endpoints
angular.module('curriculums').factory('Curriculums', ['$resource',
	function($resource) {
		return $resource('curriculums/:curriculumId', { curriculumId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

// Configuring the Articles module
angular.module('schools').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Schools', 'schools', 'dropdown', '/schools(/create)?');
		Menus.addSubMenuItem('topbar', 'schools', 'List Schools', 'schools');
		Menus.addSubMenuItem('topbar', 'schools', 'New School', 'schools/create');
	}
]);
'use strict';

//Setting up route
angular.module('schools').config(['$stateProvider',
	function($stateProvider) {
		// Schools state routing
		$stateProvider.
		state('listSchools', {
			url: '/schools',
			templateUrl: 'modules/schools/views/list-schools.client.view.html'
		}).
		state('createSchool', {
			url: '/schools/create',
			templateUrl: 'modules/schools/views/create-school.client.view.html'
		}).
		state('viewSchool', {
			url: '/schools/:schoolId',
			templateUrl: 'modules/schools/views/view-school.client.view.html'
		}).
		state('editSchool', {
			url: '/schools/:schoolId/edit',
			templateUrl: 'modules/schools/views/edit-school.client.view.html'
		});
	}
]);
'use strict';

// Schools controller
angular.module('schools').controller('SchoolsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Schools',
	function($scope, $stateParams, $location, Authentication, Schools) {
		$scope.authentication = Authentication;

		// Create new School
		$scope.create = function() {
			// Create new School object
			var school = new Schools ({
				name: this.name,
        code: this.code
			});

			// Redirect after save
			school.$save(function(response) {
				$location.path('schools/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing School
		$scope.remove = function(school) {
			if ( school ) { 
				school.$remove();

				for (var i in $scope.schools) {
					if ($scope.schools [i] === school) {
						$scope.schools.splice(i, 1);
					}
				}
			} else {
				$scope.school.$remove(function() {
					$location.path('schools');
				});
			}
		};

		// Update existing School
		$scope.update = function() {
			var school = $scope.school;

			school.$update(function() {
				$location.path('schools/' + school._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Schools
		$scope.find = function() {
			$scope.schools = Schools.query();
		};

		// Find existing School
		$scope.findOne = function() {
			$scope.school = Schools.get({ 
				schoolId: $stateParams.schoolId
			});
		};
	}
]);

'use strict';

//Schools service used to communicate Schools REST endpoints
angular.module('schools').factory('Schools', ['$resource',
	function($resource) {
		return $resource('schools/:schoolId', { schoolId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

// Configuring the Articles module
angular.module('sections').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Sections', 'sections', 'dropdown', '/sections(/create)?');
		Menus.addSubMenuItem('topbar', 'sections', 'List Sections', 'sections');
		Menus.addSubMenuItem('topbar', 'sections', 'New Section', 'sections/create');
	}
]);
'use strict';

//Setting up route
angular.module('sections').config(['$stateProvider',
	function($stateProvider) {
		// Sections state routing
		$stateProvider.
		state('listSections', {
			url: '/sections',
			templateUrl: 'modules/sections/views/list-sections.client.view.html'
		}).
		state('createSection', {
			url: '/sections/create',
			templateUrl: 'modules/sections/views/create-section.client.view.html'
		}).
		state('viewSection', {
			url: '/sections/:sectionId',
			templateUrl: 'modules/sections/views/view-section.client.view.html'
		}).
		state('editSection', {
			url: '/sections/:sectionId/edit',
			templateUrl: 'modules/sections/views/edit-section.client.view.html'
		});
	}
]);
'use strict';

// Sections controller
angular.module('sections').controller('SectionsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Sections',
	function($scope, $stateParams, $location, Authentication, Sections) {
		$scope.authentication = Authentication;

		// Create new Section
		$scope.create = function() {
			// Create new Section object
			var section = new Sections ({
				name: this.name
			});

			// Redirect after save
			section.$save(function(response) {
				$location.path('sections/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Section
		$scope.remove = function(section) {
			if ( section ) { 
				section.$remove();

				for (var i in $scope.sections) {
					if ($scope.sections [i] === section) {
						$scope.sections.splice(i, 1);
					}
				}
			} else {
				$scope.section.$remove(function() {
					$location.path('sections');
				});
			}
		};

		// Update existing Section
		$scope.update = function() {
			var section = $scope.section;

			section.$update(function() {
				$location.path('sections/' + section._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Sections
		$scope.find = function() {
			$scope.sections = Sections.query();
		};

		// Find existing Section
		$scope.findOne = function() {
			$scope.section = Sections.get({ 
				sectionId: $stateParams.sectionId
			});
		};
	}
]);
'use strict';

//Sections service used to communicate Sections REST endpoints
angular.module('sections').factory('Sections', ['$resource',
	function($resource) {
		return $resource('sections/:sectionId', { sectionId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

// Configuring the Articles module
angular.module('specs').run(['Menus',
  function(Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', 'Specs', 'specs', 'dropdown', '/specs(/create)?');
    Menus.addSubMenuItem('topbar', 'specs', 'List Specs', 'specs');
    Menus.addSubMenuItem('topbar', 'specs', 'New Spec', 'specs/create');
  }
]);

'use strict';

//Setting up route
angular.module('specs').config(['$stateProvider',
  function($stateProvider) {
    // Specs state routing
    $stateProvider.
      state('listSpecs', {
        url: '/specs',
        templateUrl: 'modules/specs/views/list-specs.client.view.html'
      }).
      state('createSpec', {
        url: '/specs/create',
        templateUrl: 'modules/specs/views/create-spec.client.view.html'
      }).
      state('viewSpec', {
        url: '/specs/:specId',
        templateUrl: 'modules/specs/views/view-spec.client.view.html'
      }).
      state('editSpec', {
        url: '/specs/:specId/edit',
        templateUrl: 'modules/specs/views/edit-spec.client.view.html'
      }).
    state('addSectionsToSpec', {
        url: '/specs/:specId/addSections',
        templateUrl: 'modules/specs/views/add-sections-to-spec.client.view.html'
      }).
    state('assignSubjectsToSections', {
        url: '/specs/:specId/assignSubjects',
        templateUrl: 'modules/specs/views/assign-subjects-to-sections.client.view.html'
      }).
    state('assignTeachersToSubjects', {
        url: '/specs/:specId/assignTeachers',
        templateUrl: '/modules/specs/views/assign-teachers-to-subjects.client.view.html'
      }).
    state('reviewAndSubmit', {
        url: '/specs/:specId/reviewAndSubmit',
        templateUrl: '/modules/specs/views/review-and-submit-spec.client.view.html'
      });
  }
]);

'use strict';
angular.module('specs').controller('GenerateModalInstanceCtrl', ["$scope", "$modalInstance", "$http", "$interval", "$timeout", "specId", function ($scope, $modalInstance, $http, $interval, $timeout, specId) {

  $scope.specId = specId;
  $scope.progress = 0;
  $scope.state = 'Initializing';
  $scope.solutionHealth = 'Unavailable';
  $scope.disableStop = false;
  console.log('SpecID for this modal is ' + specId);
  var worstScore = 0; //Used for Progress indicator

  $scope.checkProgress = function(){
    $http.get('/specs/' + $scope.specId + '/solution')
      .success(function (data, status, headers, config) {
        console.log('Invoked isSolving successfully');
        console.log('Data is ' + data);
        getCurrentStatusAndScore(data);
        $scope.progress = calculateProgress($scope.solutionHealth, $scope.progress); //TODO calculateProgress(); using current number of hard constraints which is a reasonable indicator

      })
      .error(function (data, status, headers, config) {
        console.log('Error while getting solution status');
      });
    };

  $scope.progressPromise = $interval($scope.checkProgress, 10000); //Check every 10 secs

  $scope.terminateSolving = function(){
    console.log('You want to solve? Are you sure?');
    $http.delete('/specs/' + $scope.specId + '/solution')
      .success(function (data, status, headers, config) {
        console.log('Terminated Solving');
      })
      .error(function (data, status, headers, config) {
        console.log('Error in termination');
      });
    $interval.cancel($scope.progressPromise);
    $modalInstance.close();
  };

  $scope.dismiss = function(){
    $interval.cancel($scope.progressPromise);
    $modalInstance.close();
  };

  function getHardConstraints(score){
    var re = /\d+/;
   var hardConstraints = score.match(re);
    if (hardConstraints !== null && hardConstraints.length >= 1 ){
      console.log('Hard Constraints =' + hardConstraints[0]);
      return parseInt(hardConstraints[0]);
    }
    return 0; //send a default and let the progress incrementer take care
  }

  function parseSolutionFile(){
    $scope.state = 'Importing Solution to Database...';
    $http.get('/specs/' + $scope.specId + '/solutionFile')
      .success(function (data, status, headers, config){
        console.log('Got and parsed solution');
        $scope.state = 'Complete';
      })
      .error(function (data, status, headers, config){
        console.log('Error in picking solution');
        $scope.state = 'Error. Please retry...';
      });
  }

  // Parse response to get Solution state and score values
  function getCurrentStatusAndScore(response){
    var tokenisedString = response.split(', ');
    if (tokenisedString.length !== 2){
      console.log('Incorrect Response format. Unable to calculate progress');
      $scope.state = 'Error';
    }else{
      var stateString = tokenisedString[0];
      var scoreString = tokenisedString[1];
      if (stateString.split(': ')[1].indexOf('true') !== -1){ //contains 'true'
        $scope.state = 'Solving';
      }else{
        $scope.state = 'Solution complete. Waiting for solution...';
        $scope.disableStop = true;
        $scope.progress = 100;
        $interval.cancel($scope.progressPromise);
        //Pick up the solution file after waiting for the closing formalities to get done at the J2EE server
        $timeout(parseSolutionFile(), 10000);
      }
      $scope.solutionHealth = scoreString.split(': ')[1];
    }
  }

  // Use the highest hard constraints and current hard constraints value and use it for find out solution progress
  // As the solution progresses, the number of hard constraints will reduce
  function calculateProgress(newScore, currentProgress){
    var newHardConstraints = getHardConstraints(newScore);
    if (newHardConstraints > worstScore){
      worstScore = newHardConstraints;
    }

    if (worstScore !== 0 && newScore < worstScore){
      var newProgress = 100 - (100/worstScore)*currentProgress;
      return newProgress;
    }
    //In the unlikely case the hard constraints starts at 0, there is no other way to find the progress. So give the user some indication of activity
    return currentProgress+1;

  }

}]);

'use strict';

// Specs controller
angular.module('specs').controller('SpecsController', ['$scope', '$stateParams', '$location', '$http', 'Authentication',
  '$modal', 'Specs', 'Upload', 'Sections', 'Subjects', 'Teachers',
	function($scope, $stateParams, $location, $http, Authentication,
           $modal, Specs, Upload, Sections, Subjects, Teachers) {
		$scope.authentication = Authentication;
    $scope.csvFileUploaded = false;

		// Create new Spec
    $scope.create = function() {
      // Create new Spec object
      var spec = new Specs();
      spec.name = this.name;
      if ($scope.numberOfWorkingDaysInAWeek !== undefined){
        spec.numberOfWorkingDaysInAWeek = $scope.numberOfWorkingDaysInAWeek;
      }
      if ($scope.numberOfPeriodsInADay !== undefined){
        spec.numberOfPeriodsInADay = $scope.numberOfPeriodsInADay;
      }
      if (this.csvFileUploaded === true){
          spec.specFile = this.specFileName;
          spec.origFile = this.fileOriginalName;
          spec.unsolvedXML = this.outputFileName;
          spec.state = this.uploadState;
      }else{
          spec.specFile = '';
          spec.origFile = '';
          spec.unsolvedXML = '';
          spec.state = 'Initialized. Data not defined yet.';
      }
			// Redirect after save
      spec.$save(function(response) {
        if ($scope.csvFileUploaded === true){
          $location.path('specs/' + response._id);
          // Clear form fields
          $scope.name = '';
        }else{
          $location.path('specs/' + response._id + '/addSections');
        }

			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Spec
		$scope.remove = function(spec) {
			if ( spec ) { 
				spec.$remove();

				for (var i in $scope.specs) {
					if ($scope.specs [i] === spec) {
						$scope.specs.splice(i, 1);
					}
				}
			} else {
				$scope.spec.$remove(function() {
					$location.path('specs');
				});
			}
		};

		// Update existing Spec
		$scope.update = function() {
			var spec = $scope.spec;

			spec.$update(function() {
        if ($scope.csvFileUploaded === true){
          $location.path('specs/' + spec._id);
        }else{
          $location.path('specs/' + spec._id + '/addSections');
        }

			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Specs
		$scope.find = function() {
			$scope.specs = Specs.query();
		};

		// Find existing Spec
		$scope.findOne = function() {
			$scope.spec = Specs.get({ 
				specId: $stateParams.specId
			});
		};

    $scope.upload = function (files) {
      if (files && files.length) {
          var file = files[0]; //Only 1 file allowed in this app
        console.log('file path ' + file.path);
          Upload.upload({
            url: 'specs/upload',
            fields: {
              //'username': $scope.username
            },
            file: file
          }).progress(function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            $scope.log = 'progress: ' + progressPercentage + '% ' +
            evt.config.file.name + '\n' + $scope.log;
          }).success(function (data, status, headers, config) {
            //$timeout(function() {
            //  $scope.log = 'file: ' + config.file.name + ', Response: ' + JSON.stringify(data) + '\n' + $scope.log;
            //});
            $scope.specFileName = data.specFileName;
            $scope.fileOriginalName = data.fileOriginalName;
            $scope.outputFileName = data.outputFileName;
            $scope.uploadState = data.uploadState;
            $scope.csvFileUploaded = true;
          });
      }
    };

    $scope.generateTimetable = function(size){
      //Inform server to start solving
      $http.post('/specs/solve', {
        specID : $stateParams.specId
      })
        .success(function (data, status, headers, config) {
          console.log('Started solving');
          var modalInstance = $modal.open({
            animation: true,
            templateUrl: 'generate.timetable.modal.client.view.html',
            controller: 'GenerateModalInstanceCtrl',
            size: size,
            resolve: {
              specId: function () {
                return $stateParams.specId;
              }
            }
          });
          modalInstance.result.then(function (result) {
          }, function () {
            console.info('Modal dismissed at: ' + new Date());
          });
        })
        .error(function (data, status, headers, config) {

        });
    };

    $scope.initSections = function(){
      $scope.allSections = [];
      $scope.selectedSections = []; //TODO: There is a console error for ticked property. It doesn't impact the flow but may need to be looked at
      var allSections = Sections.query(function(){
        allSections.forEach(function(section){
          $scope.allSections.push({name: section.name, ticked: false});
          if (allSections.length === $scope.allSections.length){
            //Pick the sections that are already allocated to the Spec and set ticked = true for them
            $http.get('/specs/' + $stateParams.specId + '/sections').success(function(data, status, headers, config){
              console.log('received following sections: %j', data);
              $scope.allSections.forEach(function(section){
                if (data.indexOf(section.name) !== -1){
                  //section is present in the spec
                  section.ticked = true;
                }
              });
            }).error(function (data, status, headers, config){
              $scope.error = data.message;
            });
          }
        });
      });
    };

    function isSubjectAssignedToSection(currentAssignments, subjectCode, section){
      for (var i=0; i < currentAssignments.length; i++){
        var assignment = currentAssignments[i];
        if ((assignment.subjectCode === subjectCode) && (assignment.section === section)){
          return {teacherCode: assignment.teacherCode, numberOfClassesInAWeek: assignment.numberOfClassesInAWeek};
        }
      }
      return null;
    }

    function prepareSectionAssignmentsHolder(sections, currentAssignments) {
      $scope.assignedSections = [];
      sections.forEach(function(section){
        var thisSection = {};
        thisSection.name = section;
        thisSection.allSubjects = [];
        thisSection.selectedSubjects = [];
        $scope.allSubjects.forEach(function (subject){
          var subjectCopy = {}; //Creating a copy to allow multi-select for multiple input-models corresponding to each accordion group.
          angular.copy(subject, subjectCopy);
          //Tick subject if it is already assigned
          if (isSubjectAssignedToSection(currentAssignments, subjectCopy.name, section) !== null){
            subjectCopy.ticked = true;
            thisSection.selectedSubjects.push(subjectCopy);
          }
          thisSection.allSubjects.push(subjectCopy);
        });
        $scope.assignedSections.push(thisSection);
      });
    }

    function getSectionsForSpec(){
     $http.get('/specs/' + $stateParams.specId + '/sections').success(function(data, status, headers, config){
       var sections = data;
       console.log('received following sections: %j', sections);
       //Now get the assignments in case sections have subjects assigned already
       $http.get('/specs/' + $stateParams.specId + '/assignments').success(function(data, status, headers, config){
         $scope.currentAssignments = data;
         console.log('received following assignments: %j', $scope.currentAssignments);
         prepareSectionAssignmentsHolder(sections, $scope.currentAssignments);
       });

     }).error(function (data, status, headers, config){
       $scope.error = data.message;
       $scope.assignedSections = [];
     });
    }

    $scope.addSections = function(){
      var sections = [];
      $scope.selectedSections.forEach(function (selectedSection){
        sections.push(selectedSection.name);
        if (sections.length === $scope.selectedSections.length){
          //Save in DB
          $http.post('/specs/' + $stateParams.specId + '/sections', {
            sections: sections
          }).success(function (data, status, headers, config) {
            $location.path('specs/' + $stateParams.specId + '/assignSubjects');
          }).error(function (data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            $scope.error = data.message;
          });
        }
      });
    };

    $scope.initSubjects = function(){
      $scope.allSubjects = [];
      var allSubjects = Subjects.query(function(){
        allSubjects.forEach(function(subject){
          $scope.allSubjects.push({name: subject.code, ticked: false});
        });
        getSectionsForSpec();
      });
      $scope.sectionsAccordionOneAtATime = true;
      $scope.sectionsAccordionStatus = {
        isFirstOpen: true,
        isFirstDisabled: false
      };
    };

    $scope.saveSubjectsAndProceed = function(){
      console.log('Subjects Assigned are: %j', $scope.assignedSections);
      var assignments = [];
      for (var i = 0; i < $scope.assignedSections.length; i++){
        for (var j = 0; j < $scope.assignedSections[i].selectedSubjects.length; j++){
          var assignmentObject = {};
          assignmentObject.section = $scope.assignedSections[i].name;
          assignmentObject.subjectCode = $scope.assignedSections[i].selectedSubjects[j].name; //selectedSubjects is not a 'subject' obj.
          //Check if this was already assigned previously and if yes pick up existing teacher code and numberOfClassesInAWeek
          var currentAssignment = isSubjectAssignedToSection($scope.currentAssignments, assignmentObject.subjectCode, assignmentObject.section);
          if (currentAssignment === null){
            assignmentObject.teacherCode = '';
            assignmentObject.numberOfClassesInAWeek = 0;
          }else{
            assignmentObject.teacherCode = currentAssignment.teacherCode;
            assignmentObject.numberOfClassesInAWeek = currentAssignment.numberOfClassesInAWeek;
          }
          assignments.push(assignmentObject);
        }
      }
      $scope.currentAssignments = [];
      $http.post('/specs/' + $stateParams.specId + '/assignments', {assignments: assignments})
        .success(function(data, status, headers, config){
          $location.path('specs/' + $stateParams.specId + '/assignTeachers');
        })
        .error(function(data, status, headers, config){
          $scope.error = data.message;
      });
    };

    $scope.initAssignments = function(){
      //Pick up assignments for this spec
      $http.get('/specs/' + $stateParams.specId + '/assignments').success(function(data, status, headers, config){
        console.log('received following assignments: %j', data);
        $scope.assignments = data;

      }).error(function (data, status, headers, config){
        $scope.error = data.message;
        $scope.assignments = [];
      });
      //Pick up All Teachers
      $scope.allTeachers = [];
      var teachers = Teachers.query(function(){
        teachers.forEach(function(teacher){
          $scope.allTeachers.push(teacher.code);
        });
      });
    };

    $scope.assignTeachersAndProceed = function(){
      $http.post('/specs/' + $stateParams.specId + '/assignments', {assignments: $scope.assignments})
        .success(function(data, status, headers, config){
          $location.path('specs/' + $stateParams.specId + '/reviewAndSubmit');
        })
        .error(function(data, status, headers, config){
          $scope.error = data.message;
        });
    };

    $scope.submitSpec = function(){
      $http.post('/specs/' + $stateParams.specId + '/generate',{})
        .success(function(data, status, headers, config){
          $scope.specFileName = data.specFileName;
          $scope.fileOriginalName = data.fileOriginalName;
          $scope.outputFileName = data.outputFileName;
          $scope.uploadState = data.uploadState;
          $scope.csvFileUploaded = true;
          $location.path('specs/' + $stateParams.specId);
        })
        .error(function(data, status, headers, config){
          $scope.error = data.message;
        });
    };

    $scope.backTo = function(location){
      $location.path('/specs/' + $stateParams.specId + '/' + location);
    };
	}
]);

'use strict';

//Specs service used to communicate Specs REST endpoints
angular.module('specs').factory('Specs', ['$resource',
	function($resource) {
		return $resource('specs/:specId', { specId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

// Configuring the Articles module
angular.module('subjects').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Subjects', 'subjects', 'dropdown', '/subjects(/create)?');
		Menus.addSubMenuItem('topbar', 'subjects', 'List Subjects', 'subjects');
		Menus.addSubMenuItem('topbar', 'subjects', 'New Subject', 'subjects/create');
	}
]);
'use strict';

//Setting up route
angular.module('subjects').config(['$stateProvider',
	function($stateProvider) {
		// Subjects state routing
		$stateProvider.
		state('listSubjects', {
			url: '/subjects',
			templateUrl: 'modules/subjects/views/list-subjects.client.view.html'
		}).
		state('createSubject', {
			url: '/subjects/create',
			templateUrl: 'modules/subjects/views/create-subject.client.view.html'
		}).
		state('viewSubject', {
			url: '/subjects/:subjectId',
			templateUrl: 'modules/subjects/views/view-subject.client.view.html'
		}).
		state('editSubject', {
			url: '/subjects/:subjectId/edit',
			templateUrl: 'modules/subjects/views/edit-subject.client.view.html'
		});
	}
]);
'use strict';

// Subjects controller
angular.module('subjects').controller('SubjectsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Subjects',
	function($scope, $stateParams, $location, Authentication, Subjects) {
		$scope.authentication = Authentication;

		// Create new Subject
		$scope.create = function() {
			// Create new Subject object
			var subject = new Subjects ({
				name: this.name,
        code: this.code
			});

			// Redirect after save
			subject.$save(function(response) {
				$location.path('subjects/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Subject
		$scope.remove = function(subject) {
			if ( subject ) { 
				subject.$remove();

				for (var i in $scope.subjects) {
					if ($scope.subjects [i] === subject) {
						$scope.subjects.splice(i, 1);
					}
				}
			} else {
				$scope.subject.$remove(function() {
					$location.path('subjects');
				});
			}
		};

		// Update existing Subject
		$scope.update = function() {
			var subject = $scope.subject;

			subject.$update(function() {
				$location.path('subjects/' + subject._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Subjects
		$scope.find = function() {
			$scope.subjects = Subjects.query();
		};

		// Find existing Subject
		$scope.findOne = function() {
			$scope.subject = Subjects.get({ 
				subjectId: $stateParams.subjectId
			});
		};
	}
]);

'use strict';

//Subjects service used to communicate Subjects REST endpoints
angular.module('subjects').factory('Subjects', ['$resource',
	function($resource) {
		return $resource('subjects/:subjectId', { subjectId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

// Configuring the Articles module
angular.module('teachers').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Teachers', 'teachers', 'dropdown', '/teachers(/create)?');
		Menus.addSubMenuItem('topbar', 'teachers', 'List Teachers', 'teachers');
		Menus.addSubMenuItem('topbar', 'teachers', 'New Teacher', 'teachers/create');
	}
]);
'use strict';

//Setting up route
angular.module('teachers').config(['$stateProvider',
	function($stateProvider) {
		// Teachers state routing
		$stateProvider.
		state('listTeachers', {
			url: '/teachers',
			templateUrl: 'modules/teachers/views/list-teachers.client.view.html'
		}).
		state('createTeacher', {
			url: '/teachers/create',
			templateUrl: 'modules/teachers/views/create-teacher.client.view.html'
		}).
		state('viewTeacher', {
			url: '/teachers/:teacherId',
			templateUrl: 'modules/teachers/views/view-teacher.client.view.html'
		}).
		state('editTeacher', {
			url: '/teachers/:teacherId/edit',
			templateUrl: 'modules/teachers/views/edit-teacher.client.view.html'
		});
	}
]);
'use strict';

// Teachers controller
angular.module('teachers').controller('TeachersController', ['$scope', '$stateParams', '$location', 'Authentication', 'Teachers',
	function($scope, $stateParams, $location, Authentication, Teachers) {
		$scope.authentication = Authentication;

		// Create new Teacher
		$scope.create = function() {
			// Create new Teacher object
			var teacher = new Teachers ({
				firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        details: this.details,
        code: this.code
			});

			// Redirect after save
			teacher.$save(function(response) {
				$location.path('teachers/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Teacher
		$scope.remove = function(teacher) {
			if ( teacher ) { 
				teacher.$remove();

				for (var i in $scope.teachers) {
					if ($scope.teachers [i] === teacher) {
						$scope.teachers.splice(i, 1);
					}
				}
			} else {
				$scope.teacher.$remove(function() {
					$location.path('teachers');
				});
			}
		};

		// Update existing Teacher
		$scope.update = function() {
			var teacher = $scope.teacher;

			teacher.$update(function() {
				$location.path('teachers/' + teacher._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Teachers
		$scope.find = function() {
			$scope.teachers = Teachers.query();
		};

		// Find existing Teacher
		$scope.findOne = function() {
			$scope.teacher = Teachers.get({ 
        teacherId: $stateParams.teacherId
			});
		};
	}
]);

'use strict';

//Teachers service used to communicate Teachers REST endpoints
angular.module('teachers').factory('Teachers', ['$resource',
	function($resource) {
		return $resource('teachers/:teacherId', { teacherId: '@_id'
		}, {
			update: {
				method: 'PUT'
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
          label  : 'Your Timetables',
          parent : 'home'
        }
      }).
      state('displayTimetable', {
        url           : '/timetables/:specId',
        templateUrl   : 'modules/timetables/views/display-timetable.client.view.html',
        ncyBreadcrumb : {
          label  : 'Timetable for Spec',
          parent : 'listTimetables'
        }
      }).
      state('viewTimetable', {
        url           : '/timetables/:specId/curriculum/:curriculumId',
        templateUrl   : 'modules/timetables/views/view-timetable.client.view.html',
        ncyBreadcrumb : {
          label  : 'Class Timetable',
          parent : 'displayTimetable'
        }
      }).
      state('viewTeacherTimetable', {
        url           : '/timetables/:specId/teacher/:id',
        templateUrl   : 'modules/timetables/views/view-teacher-timetable.client.view.html',
        ncyBreadcrumb : {
          label  : 'Teacher Timetable',
          parent : 'displayTimetable'
        }
      }).
      state('viewDayTimetable', {
        url           : '/timetables/:specId/day/:dayIndex',
        templateUrl   : 'modules/timetables/views/view-day-timetable.client.view.html',
        ncyBreadcrumb : {
          label  : 'Timetable for Day',
          parent : 'displayTimetable'
        }
      }).
      state('editTimetable', {
        url           : '/timetables/:specId/edit/:curriculumId',
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
      $scope.specId = $stateParams.specId;
      $scope.timetable = Days.get({
        specId : $scope.specId,
        dayIndex : $stateParams.dayIndex
      });
      $scope.teachers = Teachers.query({specId : $scope.specId});
    };

    //Due to the checks there, only one of the below will trigger the prepareUnassignedTeachersForPeriods Functionality.
    $scope.$watch('timetable.timetableForDay.length > 0', prepareUnassignedTeachersForPeriods);
    $scope.$watch('teachers.length > 0', prepareUnassignedTeachersForPeriods);
  }
]);

/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TeacherTimetableController', ['$http', '$scope', '$stateParams', '$location', 'Authentication', 'Timetables', 'TimetableForTeacher', 'SpecIdHolder',
  function ($http, $scope, $stateParams, $location, Authentication, Timetables, TimetableForTeacher, SpecIdHolder) {
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
      $scope.specId = SpecIdHolder.getSpecId();
      $scope.timetableForTeacher = TimetableForTeacher.get({
        specId : $scope.specId,
        id : $stateParams.id
      });

    };
  }
]);

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
      //We might need to add a bg-color property to the cell in the timetable itself
      // so that the same color remains across refreshes as well
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

    function getDayNameFromIndex(index){
      var days = {
        0 : 'Monday',
        1 : 'Tuesday',
        2 : 'Wednesday',
        3 : 'Thursday',
        4 : 'Friday',
        5 : 'Saturday',
        6 : 'Sunday'
      };
      return days[index];
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

      $http.get('/specs/' + $stateParams.specId + '/teachers', {})
        .success(function (data, status, headers, config) {
          $scope.teachers = data;
        })
        .error(function (data, status, headers, config) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          $scope.error = data.message;
        });

      //$scope.teachers = Teachers.query({
      //  specId : $stateParams.specId
      //});

      $http.get('/specs/' + $stateParams.specId, {})
        .success(function (data, status, headers, config) {
          $scope.workingDays = [];
          for (var dayCount=0; dayCount<data.numberOfWorkingDaysInAWeek; dayCount++){
            var dayObj = {};
            dayObj.dayIndex = dayCount;
            dayObj.dayName = getDayNameFromIndex(dayCount);
            $scope.workingDays.push(dayObj);
          }
        })
        .error(function (data, status, headers, config) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          $scope.error = data.message;
        });
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
      return $filter('date')(allocation.timestamp, 'short') + ': Period ' + (parseInt(allocation.periodIndex, 10) + 1) + ' - ' + getDayNameFromIndex(allocation.dayIndex) +
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
    return $resource('timetables/:specId', {
      specId : '@specId'
    }, {'update' : {method : 'PUT'}});
  }
]);

angular.module('timetables').factory('TimetableForCurriculum', ['$resource',
  function ($resource) {
    return $resource('timetables/:specId/curriculum/:curriculumId', {
      specId : '@specId',
      curriculumId : '@curriculumId'
    }, {'update' : {method : 'PUT'}});
  }
]);

/*angular.module('timetables').factory('Teachers', ['$resource',
  function ($resource) {
    return $resource('teachers/:specId', {
      specId : '@specId'
    }, {'update' : {method : 'PUT'}});
  }
]);*/

angular.module('timetables').factory('TimetableForTeacher', ['$resource',
function ($resource) {
  return $resource('timetables/:specId/teacher/:id', {
    specId : '@specId',
    id : '@id'
  });
}]);

angular.module('timetables').factory('Days', ['$resource',
  function ($resource) {
    return $resource('timetables/:specId/day/:dayIndex', {
      specId : '@specId',
      dayIndex : '@dayIndex'
    }, {'update' : {method : 'PUT'}});
  }
]);

angular.module('timetables').service('SpecIdHolder', function() {
    this.specId = '';
    this.setSpecId = function(specIdInContext) { this.specId = specIdInContext; };
    this.getSpecId = function() { return this.specId; };
});

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
