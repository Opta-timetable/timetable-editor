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