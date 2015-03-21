'use strict';

angular.module('timetables').factory('Timetables', ['$resource',
	function($resource) {
		return $resource('timetables/:curriculumId', {
			curriculumId: '@id'
		}, {
      update: {
        method: 'PUT'
      }
    });
	}
]);

