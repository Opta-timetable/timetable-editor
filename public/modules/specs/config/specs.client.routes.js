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
      });
  }
]);
