'use strict';

angular.module('courses').factory('Courses', ['$resource',
	function($resource) {
		return $resource('courses/:courseId', {
			courseId: '@_id'
		}, {
      update: {
        method: 'PUT'
      }
    });
	}
]);
