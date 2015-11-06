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