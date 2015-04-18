'use strict';

// Setting up route
angular.module('timetables').config(['$stateProvider',
  function ($stateProvider) {
    // Courses state routing
    $stateProvider.
      state('listTimetables', {
        url         : '/timetables',
        templateUrl : 'modules/timetables/views/list-timetables.client.view.html'
      }).
      state('viewTimetable', {
        url         : '/timetables/:curriculumId',
        templateUrl : 'modules/timetables/views/view-timetable.client.view.html'
      }).
      state('editTimetable', {
            url: '/timetables/edit/:curriculumId',
            views: {
                '': {templateUrl: 'modules/timetables/views/edit-timetable.client.view.html'},
                'reportsView@editTimetable': {templateUrl: '/modules/timetables/views/view-reports.client.view.html'}
            }
        });
  }
]);
