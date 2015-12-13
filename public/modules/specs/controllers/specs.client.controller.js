'use strict';

// Specs controller
angular.module('specs').controller('SpecsController', ['$scope', '$stateParams', '$location', '$http', 'Authentication',
  '$modal', 'Specs', 'Upload', 'Sections', 'Subjects', 'Teachers',
	function($scope, $stateParams, $location, $http, Authentication,
           $modal, Specs, Upload, Sections, Subjects, Teachers) {
		$scope.authentication = Authentication;
    $scope.csvFileUploaded = false;

		// Create new Spec
    $scope.create = function() {
      // Create new Spec object
      var spec;
      if (this.csvFileUploaded === true){
        spec = new Specs ({
          name: this.name,
          specFile: this.specFileName,
          origFile: this.fileOriginalName,
          unsolvedXML: this.outputFileName,
          state: this.uploadState
        });
      }else{
        spec = new Specs ({
          name: this.name,
          specFile: '',
          origFile: '',
          unsolvedXML: '',
          state: 'Initialized. Data not defined yet.'
        });
      }

			// Redirect after save
      spec.$save(function(response) {
        if ($scope.csvFileUploaded === true){
          $location.path('specs/' + response._id);
          // Clear form fields
          $scope.name = '';
        }else{
          $location.path('specs/' + response._id + '/addSections');
        }

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
            $scope.csvFileUploaded = true;
          });
      }
    };

    $scope.generateTimetable = function(size){
      //Inform server to start solving
      $http.post('/specs/solve', {
        specID : $stateParams.specId
      })
        .success(function (data, status, headers, config) {
          console.log('Started solving');
          var modalInstance = $modal.open({
            animation: true,
            templateUrl: 'generate.timetable.modal.client.view.html',
            controller: 'GenerateModalInstanceCtrl',
            size: size,
            resolve: {
              specId: function () {
                return $stateParams.specId;
              }
            }
          });
          modalInstance.result.then(function (result) {
          }, function () {
            console.info('Modal dismissed at: ' + new Date());
          });
        })
        .error(function (data, status, headers, config) {

        });
    };

    $scope.initSections = function(){
      $scope.allSections = [];
      $scope.selectedSections = []; //TODO: There is a console error for ticked property. It doesn't impact the flow but may need to be looked at
      var allSections = Sections.query(function(){
        allSections.forEach(function(section){
          $scope.allSections.push({name: section.name, ticked: false});
        });
      });
    };

    function prepareSectionAssignmentsHolder(sections) {
      $scope.assignedSections = [];
      sections.forEach(function(section){
        var thisSection = {};
        thisSection.name = section;
        //var array2 = [].concat(array1 || []);
        thisSection.allSubjects = [];
        $scope.allSubjects.forEach(function (subject){
          var subjectCopy = {}; //Creating a copy to allow multi-select for multiple input-models corresponding to each accordion group.
          angular.copy(subject, subjectCopy);
          thisSection.allSubjects.push(subjectCopy);
        });
        thisSection.selectedSubjects = [];
        $scope.assignedSections.push(thisSection);
      });
    }

    function getSectionsForSpec(){
     $http.get('/specs/' + $stateParams.specId + '/sections').success(function(data, status, headers, config){
       console.log('received following sections: %j', data);
       prepareSectionAssignmentsHolder(data);
     }).error(function (data, status, headers, config){
       $scope.error = data.message;
       $scope.assignedSections = [];
     });
    }

    $scope.addSections = function(){
      var sections = [];
      $scope.selectedSections.forEach(function (selectedSection){
        sections.push(selectedSection.name);
        if (sections.length === $scope.selectedSections.length){
          //Save in DB
          $http.post('/specs/' + $stateParams.specId + '/sections', {
            sections: sections
          }).success(function (data, status, headers, config) {
            $location.path('specs/' + $stateParams.specId + '/assignSubjects');
          }).error(function (data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            $scope.error = data.message;
          });
        }
      });
    };

    $scope.initSubjects = function(){
      $scope.allSubjects = [];
      var allSubjects = Subjects.query(function(){
        allSubjects.forEach(function(subject){
          $scope.allSubjects.push({name: subject.code, ticked: false});
        });
        getSectionsForSpec();
      });
      $scope.sectionsAccordionOneAtATime = true;
      $scope.sectionsAccordionStatus = {
        isFirstOpen: true,
        isFirstDisabled: false
      };
    };

    $scope.saveSubjectsAndProceed = function(){
      console.log('Subjects Assigned are: %j', $scope.assignedSections);
      var assignments = [];
      for (var i = 0; i < $scope.assignedSections.length; i++){
        for (var j = 0; j < $scope.assignedSections[i].selectedSubjects.length; j++){
          var assignmentObject = {};
          assignmentObject.section = $scope.assignedSections[i].name;
          assignmentObject.subjectCode = $scope.assignedSections[i].selectedSubjects[j].name; //selectedSubjects is not a 'subject' obj.
          assignmentObject.teacherCode = '';
          assignmentObject.numberOfClassesInAWeek = 0;

          assignments.push(assignmentObject);
        }
      }
      $http.put('/specs/' + $stateParams.specId + '/assignments', {assignments: assignments})
        .success(function(data, status, headers, config){
          $location.path('specs/' + $stateParams.specId + '/assignTeachers');
        })
        .error(function(data, status, headers, config){
          $scope.error = data.message;
      });
    };

    $scope.initAssignments = function(){
      //Pick up assignments for this spec
      $http.get('/specs/' + $stateParams.specId + '/assignments').success(function(data, status, headers, config){
        console.log('received following assignments: %j', data);
        $scope.assignments = data;

      }).error(function (data, status, headers, config){
        $scope.error = data.message;
        $scope.assignments = [];
      });
      //Pick up All Teachers
      $scope.allTeachers = [];
      var teachers = Teachers.query(function(){
        teachers.forEach(function(teacher){
          $scope.allTeachers.push(teacher.code);
        });
      });
    };

    $scope.assignTeachersAndProceed = function(){
      $http.post('/specs/' + $stateParams.specId + '/assignments', {assignments: $scope.assignments})
        .success(function(data, status, headers, config){
          $location.path('specs/' + $stateParams.specId + '/reviewAndSubmit');
        })
        .error(function(data, status, headers, config){
          $scope.error = data.message;
        });
    };

    $scope.submitSpec = function(){
      $http.post('/specs/' + $stateParams.specId + '/generate',{})
        .success(function(data, status, headers, config){
          $scope.specFileName = data.specFileName;
          $scope.fileOriginalName = data.fileOriginalName;
          $scope.outputFileName = data.outputFileName;
          $scope.uploadState = data.uploadState;
          $scope.csvFileUploaded = true;
          $location.path('specs/' + $stateParams.specId);
        })
        .error(function(data, status, headers, config){
          $scope.error = data.message;
        });
    };
	}
]);
