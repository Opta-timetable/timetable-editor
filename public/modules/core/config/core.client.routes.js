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
