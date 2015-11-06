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