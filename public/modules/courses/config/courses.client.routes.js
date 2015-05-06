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
