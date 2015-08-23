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
        url           : '/timetables/:specId/teacher/:_id',
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
