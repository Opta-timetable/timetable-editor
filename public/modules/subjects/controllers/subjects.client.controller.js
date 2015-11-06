'use strict';

// Subjects controller
angular.module('subjects').controller('SubjectsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Subjects',
	function($scope, $stateParams, $location, Authentication, Subjects) {
		$scope.authentication = Authentication;

		// Create new Subject
		$scope.create = function() {
			// Create new Subject object
			var subject = new Subjects ({
				name: this.name,
        code: this.code
			});

			// Redirect after save
			subject.$save(function(response) {
				$location.path('subjects/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Subject
		$scope.remove = function(subject) {
			if ( subject ) { 
				subject.$remove();

				for (var i in $scope.subjects) {
					if ($scope.subjects [i] === subject) {
						$scope.subjects.splice(i, 1);
					}
				}
			} else {
				$scope.subject.$remove(function() {
					$location.path('subjects');
				});
			}
		};

		// Update existing Subject
		$scope.update = function() {
			var subject = $scope.subject;

			subject.$update(function() {
				$location.path('subjects/' + subject._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Subjects
		$scope.find = function() {
			$scope.subjects = Subjects.query();
		};

		// Find existing Subject
		$scope.findOne = function() {
			$scope.subject = Subjects.get({ 
				subjectId: $stateParams.subjectId
			});
		};
	}
]);
