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
        url         : '/timetables/:id',
        templateUrl : 'modules/timetables/views/view-timetable.client.view.html'
      });
  }
]);
