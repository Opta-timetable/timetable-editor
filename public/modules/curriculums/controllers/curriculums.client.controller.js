'use strict';

// Curriculums controller
angular.module('curriculums').controller('CurriculumsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Curriculums',
	function($scope, $stateParams, $location, Authentication, Curriculums) {
		$scope.authentication = Authentication;

		// Create new Curriculum
		$scope.create = function() {
			// Create new Curriculum object
			var curriculum = new Curriculums ({
				name: this.name
			});

			// Redirect after save
			curriculum.$save(function(response) {
				$location.path('curriculums/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Curriculum
		$scope.remove = function(curriculum) {
			if ( curriculum ) { 
				curriculum.$remove();

				for (var i in $scope.curriculums) {
					if ($scope.curriculums [i] === curriculum) {
						$scope.curriculums.splice(i, 1);
					}
				}
			} else {
				$scope.curriculum.$remove(function() {
					$location.path('curriculums');
				});
			}
		};

		// Update existing Curriculum
		$scope.update = function() {
			var curriculum = $scope.curriculum;

			curriculum.$update(function() {
				$location.path('curriculums/' + curriculum._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Curriculums
		$scope.find = function() {
			$scope.curriculums = Curriculums.query();
		};

		// Find existing Curriculum
		$scope.findOne = function() {
			$scope.curriculum = Curriculums.get({ 
				curriculumId: $stateParams.curriculumId
			});
		};
	}
]);