'use strict';

angular.module('timetables').factory('Timetables', ['$resource',
	function($resource) {
		return $resource('timetables/:curriculumId', {
            curriculumId: '@curriculumId'
        } ,{'update' :{method:'PUT'}});
	}
]);

angular.module('timetables').factory('Curriculums', function() {
        var curriculums = [];
        function set(data) {
            curriculums = data;
        }
        function get() {
            return curriculums;
        }
        return {
            set: set,
            get: get
        }
    }
);
