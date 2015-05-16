'use strict';

angular.module('timetables').factory('Timetables', ['$resource',
  function ($resource) {
    return $resource('timetables/:curriculumId', {
      curriculumId : '@curriculumId'
    }, {'update' : {method : 'PUT'}});
  }
]);

angular.module('timetables').factory('Teachers', ['$resource',
  function ($resource) {
    return $resource('timetables/teachers/:_id', {
      _id : '@_id'
    }, {'update' : {method : 'PUT'}});
  }
]);

angular.module('timetables').factory('Days', ['$resource',
  function ($resource) {
    return $resource('timetables/days/:dayIndex', {
      dayIndex : '@dayIndex'
    }, {'update' : {method : 'PUT'}});
  }
]);
