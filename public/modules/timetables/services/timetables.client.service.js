'use strict';

angular.module('timetables').factory('Timetables', ['$resource',
  function ($resource) {
    return $resource('timetables/:specId', {
      specId : '@specId'
    }, {'update' : {method : 'PUT'}});
  }
]);

angular.module('timetables').factory('TimetableForCurriculum', ['$resource',
  function ($resource) {
    return $resource('timetables/:specId/curriculum/:curriculumId', {
      specId : '@specId',
      curriculumId : '@curriculumId'
    }, {'update' : {method : 'PUT'}});
  }
]);

angular.module('timetables').factory('Teachers', ['$resource',
  function ($resource) {
    return $resource('teachers/:specId', {
      specId : '@specId'
    }, {'update' : {method : 'PUT'}});
  }
]);

angular.module('timetables').factory('TimetableForTeacher', ['$resource',
function ($resource) {
  return $resource('timetables/:specId/teacher/:_id', {
    specId : '@specId',
    _id : '@_id'
  });
}]);

angular.module('timetables').factory('Days', ['$resource',
  function ($resource) {
    return $resource('timetables/:specId/day/:dayIndex', {
      specId : '@specId',
      dayIndex : '@dayIndex'
    }, {'update' : {method : 'PUT'}});
  }
]);

angular.module('timetables').service('SpecIdHolder', function() {
    this.specId = '';
    this.setSpecId = function(specIdInContext) { this.specId = specIdInContext; };
    this.getSpecId = function() { return this.specId; };
});
