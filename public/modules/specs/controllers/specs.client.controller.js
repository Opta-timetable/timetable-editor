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
      var spec = new Specs();
      spec.name = this.name;
      if ($scope.numberOfWorkingDaysInAWeek !== undefined){
        spec.numberOfWorkingDaysInAWeek = $scope.numberOfWorkingDaysInAWeek;
      }
      if ($scope.numberOfPeriodsInADay !== undefined){
        spec.numberOfPeriodsInADay = $scope.numberOfPeriodsInADay;
      }
      if (this.csvFileUploaded === true){
          spec.specFile = this.specFileName;
          spec.origFile = this.fileOriginalName;
          spec.unsolvedXML = this.outputFileName;
          spec.state = this.uploadState;
      }else{
          spec.specFile = '';
          spec.origFile = '';
          spec.unsolvedXML = '';
          spec.state = 'Initialized. Data not defined yet.';
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

      var confirmationDialogModalInstance = $modal.open({
        animation: true,
        templateUrl: 'ConfirmationDialogModal.html',
        controller: 'ConfirmationDialogController',
        size: 'sm',
        resolve: {
          message: function () {
            return 'This action will delete your specification along with generated timetables if any. ' +
              'Please confirm.';
          }
        }
      });

      confirmationDialogModalInstance.result.then(function (result) {
        console.log('result is ' + result);
        //Take an action depending on user's confirmation
        if (result.confirm === true){
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
        }
      }, function () {
        console.info('Modal dismissed at: ' + new Date());
      });
    };

		// Update existing Spec
		$scope.update = function() {
			var spec = $scope.spec;

			spec.$update(function() {
        if ($scope.csvFileUploaded === true){
          $location.path('specs/' + spec._id);
        }else{
          $location.path('specs/' + spec._id + '/addSections');
        }

			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Specs
		$scope.find = function() {
      $scope.showSpinner = true;
			$scope.specs = Specs.query(function(){
        $scope.showSpinner = false;
      });
		};

		// Find existing Spec
		$scope.findOne = function() {
      $scope.showSpinner = true;
			$scope.spec = Specs.get({ 
				specId: $stateParams.specId
			}, function(){
        $scope.showSpinner = false;
        $scope.disableGenerateButton = true;
        if (($scope.spec.state === 'Data ready for timetable generation') ||
          ($scope.spec.state === 'Timetable Generated and Available for use')){
          $scope.disableGenerateButton = false;
        }
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

    function startSolving(){
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
            size: 'lg',
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

    $scope.generateTimetable = function(){
      //Confirm that user really wants to if the spec has a timetable generated already
      if ($scope.spec.state === 'Timetable Generated and Available for use'){
        var confirmationDialogModalInstance = $modal.open({
          animation: true,
          templateUrl: 'ConfirmationDialogModal.html',
          controller: 'ConfirmationDialogController',
          size: 'sm',
          resolve: {
            message: function () {
              return 'You will lose the timetable that is already available. ' +
                'Please confirm.';
            }
          }
        });
        confirmationDialogModalInstance.result.then(function (result) {
          console.log('result is ' + result);
          //Take an action depending on user's confirmation
          if (result.confirm === true){
            startSolving();
          }
        }, function () {
          console.info('Modal dismissed at: ' + new Date());
        });

      }else{
        startSolving();
      }
    };

    $scope.initSections = function(){
      $scope.showSpinner = true;
      $scope.allSections = [];
      $scope.selectedSections = []; //TODO: There is a console error for ticked property. It doesn't impact the flow but may need to be looked at
      var allSections = Sections.query(function(){
        allSections.forEach(function(section){
          $scope.allSections.push({name: section.name, ticked: false});
          if (allSections.length === $scope.allSections.length){
            //Pick the sections that are already allocated to the Spec and set ticked = true for them
            $http.get('/specs/' + $stateParams.specId + '/sections').success(function(data, status, headers, config){
              console.log('received following sections: %j', data);
              $scope.allSections.forEach(function(section){
                if (data.indexOf(section.name) !== -1){
                  //section is present in the spec
                  section.ticked = true;
                }
              });
              $scope.showSpinner = false;
            }).error(function (data, status, headers, config){
              $scope.error = data.message;
              $scope.showSpinner = false;
            });
          }
        });
      });
    };

    function isSubjectAssignedToSection(currentAssignments, subjectCode, section){
      for (var i=0; i < currentAssignments.length; i++){
        var assignment = currentAssignments[i];
        if ((assignment.subjectCode === subjectCode) && (assignment.section === section)){
          return {teacherCode: assignment.teacherCode, numberOfClassesInAWeek: assignment.numberOfClassesInAWeek};
        }
      }
      return null;
    }

    function prepareSectionAssignmentsHolder(sections, currentAssignments) {
      $scope.assignedSections = [];
      sections.forEach(function(section){
        var thisSection = {};
        thisSection.name = section;
        thisSection.allSubjects = [];
        thisSection.selectedSubjects = [];
        $scope.allSubjects.forEach(function (subject){
          var subjectCopy = {}; //Creating a copy to allow multi-select for multiple input-models corresponding to each accordion group.
          angular.copy(subject, subjectCopy);
          //Tick subject if it is already assigned
          if (isSubjectAssignedToSection(currentAssignments, subjectCopy.name, section) !== null){
            subjectCopy.ticked = true;
            thisSection.selectedSubjects.push(subjectCopy);
          }
          thisSection.allSubjects.push(subjectCopy);
        });
        $scope.assignedSections.push(thisSection);
      });
    }

    function getSectionsForSpec(){
     $http.get('/specs/' + $stateParams.specId + '/sections').success(function(data, status, headers, config){
       var sections = data;
       console.log('received following sections: %j', sections);
       //Now get the assignments in case sections have subjects assigned already
       $http.get('/specs/' + $stateParams.specId + '/assignments').success(function(data, status, headers, config){
         $scope.currentAssignments = data;
         console.log('received following assignments: %j', $scope.currentAssignments);
         prepareSectionAssignmentsHolder(sections, $scope.currentAssignments);
       });

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
      $scope.showSpinner = true;
      $scope.allSubjects = [];
      var allSubjects = Subjects.query(function(){
        allSubjects.forEach(function(subject){
          $scope.allSubjects.push({name: subject.code, ticked: false});
        });
        getSectionsForSpec();
        $scope.showSpinner = false;
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
          //Check if this was already assigned previously and if yes pick up existing teacher code and numberOfClassesInAWeek
          var currentAssignment = isSubjectAssignedToSection($scope.currentAssignments, assignmentObject.subjectCode, assignmentObject.section);
          if (currentAssignment === null){
            assignmentObject.teacherCode = '';
            assignmentObject.numberOfClassesInAWeek = 0;
          }else{
            assignmentObject.teacherCode = currentAssignment.teacherCode;
            assignmentObject.numberOfClassesInAWeek = currentAssignment.numberOfClassesInAWeek;
          }
          assignments.push(assignmentObject);
        }
      }
      $scope.currentAssignments = [];
      $http.post('/specs/' + $stateParams.specId + '/assignments', {assignments: assignments})
        .success(function(data, status, headers, config){
          $location.path('specs/' + $stateParams.specId + '/assignTeachers');
        })
        .error(function(data, status, headers, config){
          $scope.error = data.message;
      });
    };

    $scope.initAssignments = function(){
      //Pick up assignments for this spec
      $scope.showSpinner = true;
      $http.get('/specs/' + $stateParams.specId + '/assignments').success(function(data, status, headers, config){
        console.log('received following assignments: %j', data);
        $scope.assignments = data;
        $scope.showSpinner = false;

      }).error(function (data, status, headers, config){
        $scope.error = data.message;
        $scope.assignments = [];
        $scope.showSpinner = false;
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

    $scope.backTo = function(location){
      $location.path('/specs/' + $stateParams.specId + '/' + location);
    };
	}
]);
