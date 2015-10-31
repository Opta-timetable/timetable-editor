'use strict';

//Specs service used to communicate Specs REST endpoints
angular.module('specs').factory('Specs', ['$resource',
	function($resource) {
		return $resource('specs/:specId', { specId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);