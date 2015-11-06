'use strict';

(function() {
	// Subjects Controller Spec
	describe('Subjects Controller Tests', function() {
		// Initialize global variables
		var SubjectsController,
		scope,
		$httpBackend,
		$stateParams,
		$location;

		// The $resource service augments the response object with methods for updating and deleting the resource.
		// If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
		// the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
		// When the toEqualData matcher compares two objects, it takes only object properties into
		// account and ignores methods.
		beforeEach(function() {
			jasmine.addMatchers({
				toEqualData: function(util, customEqualityTesters) {
					return {
						compare: function(actual, expected) {
							return {
								pass: angular.equals(actual, expected)
							};
						}
					};
				}
			});
		});

		// Then we can start by loading the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		// The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
		// This allows us to inject a service but then attach it to a variable
		// with the same name as the service.
		beforeEach(inject(function($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_) {
			// Set a new global scope
			scope = $rootScope.$new();

			// Point global variables to injected services
			$stateParams = _$stateParams_;
			$httpBackend = _$httpBackend_;
			$location = _$location_;

			// Initialize the Subjects controller.
			SubjectsController = $controller('SubjectsController', {
				$scope: scope
			});
		}));

		it('$scope.find() should create an array with at least one Subject object fetched from XHR', inject(function(Subjects) {
			// Create sample Subject using the Subjects service
			var sampleSubject = new Subjects({
				name: 'New Subject'
			});

			// Create a sample Subjects array that includes the new Subject
			var sampleSubjects = [sampleSubject];

			// Set GET response
			$httpBackend.expectGET('subjects').respond(sampleSubjects);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.subjects).toEqualData(sampleSubjects);
		}));

		it('$scope.findOne() should create an array with one Subject object fetched from XHR using a subjectId URL parameter', inject(function(Subjects) {
			// Define a sample Subject object
			var sampleSubject = new Subjects({
				name: 'New Subject'
			});

			// Set the URL parameter
			$stateParams.subjectId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/subjects\/([0-9a-fA-F]{24})$/).respond(sampleSubject);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.subject).toEqualData(sampleSubject);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(Subjects) {
			// Create a sample Subject object
			var sampleSubjectPostData = new Subjects({
				name: 'New Subject'
			});

			// Create a sample Subject response
			var sampleSubjectResponse = new Subjects({
				_id: '525cf20451979dea2c000001',
				name: 'New Subject'
			});

			// Fixture mock form input values
			scope.name = 'New Subject';

			// Set POST response
			$httpBackend.expectPOST('subjects', sampleSubjectPostData).respond(sampleSubjectResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the Subject was created
			expect($location.path()).toBe('/subjects/' + sampleSubjectResponse._id);
		}));

		it('$scope.update() should update a valid Subject', inject(function(Subjects) {
			// Define a sample Subject put data
			var sampleSubjectPutData = new Subjects({
				_id: '525cf20451979dea2c000001',
				name: 'New Subject'
			});

			// Mock Subject in scope
			scope.subject = sampleSubjectPutData;

			// Set PUT response
			$httpBackend.expectPUT(/subjects\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/subjects/' + sampleSubjectPutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid subjectId and remove the Subject from the scope', inject(function(Subjects) {
			// Create new Subject object
			var sampleSubject = new Subjects({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Subjects array and include the Subject
			scope.subjects = [sampleSubject];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/subjects\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleSubject);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.subjects.length).toBe(0);
		}));
	});
}());