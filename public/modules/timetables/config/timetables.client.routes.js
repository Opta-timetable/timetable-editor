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
