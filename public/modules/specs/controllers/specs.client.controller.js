'use strict';

// Specs controller
angular.module('specs').controller('SpecsController', ['$scope', '$stateParams', '$location', '$http', 'Authentication', 'Specs', 'Upload',
	function($scope, $stateParams, $location, $http, Authentication, Specs, Upload) {
		$scope.authentication = Authentication;

		// Create new Spec
		$scope.create = function() {
			// Create new Spec object
			var spec = new Specs ({
				name: this.name,
        specFile: this.specFileName,
        origFile: this.fileOriginalName,
        unsolvedXML: this.outputFileName,
        state: this.uploadState
			});

			// Redirect after save
			spec.$save(function(response) {
				$location.path('specs/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Spec
		$scope.remove = function(spec) {
			if ( spec ) { 
				spec.$remove();

				for (var i in $scope.specs) {
					if ($scope.specs [i] === spec) {
						$scope.specs.splice(i, 1);
					}
				}
			} else {
				$scope.spec.$remove(function() {
					$location.path('specs');
				});
			}
		};

		// Update existing Spec
		$scope.update = function() {
			var spec = $scope.spec;

			spec.$update(function() {
				$location.path('specs/' + spec._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Specs
		$scope.find = function() {
			$scope.specs = Specs.query();
		};

		// Find existing Spec
		$scope.findOne = function() {
			$scope.spec = Specs.get({ 
				specId: $stateParams.specId
			});
		};

    $scope.upload = function (files) {
      if (files && files.length) {
          var file = files[0]; //Only 1 file allowed in this app
        console.log('file path ' + file.path);
          Upload.upload({
            url: 'specs/upload',
            fields: {
              //'username': $scope.username
            },
            file: file
          }).progress(function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            $scope.log = 'progress: ' + progressPercentage + '% ' +
            evt.config.file.name + '\n' + $scope.log;
          }).success(function (data, status, headers, config) {
            //$timeout(function() {
            //  $scope.log = 'file: ' + config.file.name + ', Response: ' + JSON.stringify(data) + '\n' + $scope.log;
            //});
            $scope.specFileName = data.specFileName;
            $scope.fileOriginalName = data.fileOriginalName;
            $scope.outputFileName = data.outputFileName;
            $scope.uploadState = data.uploadState;
          });
      }
    };
	}
]);
