'use strict';

//Schools service used to communicate Schools REST endpoints
angular.module('schools').factory('Schools', ['$resource',
	function($resource) {
		return $resource('schools/:schoolId', { schoolId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);