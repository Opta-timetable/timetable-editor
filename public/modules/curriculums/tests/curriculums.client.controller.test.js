'use strict';

(function() {
	// Curriculums Controller Spec
	describe('Curriculums Controller Tests', function() {
		// Initialize global variables
		var CurriculumsController,
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

			// Initialize the Curriculums controller.
			CurriculumsController = $controller('CurriculumsController', {
				$scope: scope
			});
		}));

		it('$scope.find() should create an array with at least one Curriculum object fetched from XHR', inject(function(Curriculums) {
			// Create sample Curriculum using the Curriculums service
			var sampleCurriculum = new Curriculums({
				name: 'New Curriculum'
			});

			// Create a sample Curriculums array that includes the new Curriculum
			var sampleCurriculums = [sampleCurriculum];

			// Set GET response
			$httpBackend.expectGET('curriculums').respond(sampleCurriculums);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.curriculums).toEqualData(sampleCurriculums);
		}));

		it('$scope.findOne() should create an array with one Curriculum object fetched from XHR using a curriculumId URL parameter', inject(function(Curriculums) {
			// Define a sample Curriculum object
			var sampleCurriculum = new Curriculums({
				name: 'New Curriculum'
			});

			// Set the URL parameter
			$stateParams.curriculumId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/curriculums\/([0-9a-fA-F]{24})$/).respond(sampleCurriculum);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.curriculum).toEqualData(sampleCurriculum);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(Curriculums) {
			// Create a sample Curriculum object
			var sampleCurriculumPostData = new Curriculums({
				name: 'New Curriculum'
			});

			// Create a sample Curriculum response
			var sampleCurriculumResponse = new Curriculums({
				_id: '525cf20451979dea2c000001',
				name: 'New Curriculum'
			});

			// Fixture mock form input values
			scope.name = 'New Curriculum';

			// Set POST response
			$httpBackend.expectPOST('curriculums', sampleCurriculumPostData).respond(sampleCurriculumResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the Curriculum was created
			expect($location.path()).toBe('/curriculums/' + sampleCurriculumResponse._id);
		}));

		it('$scope.update() should update a valid Curriculum', inject(function(Curriculums) {
			// Define a sample Curriculum put data
			var sampleCurriculumPutData = new Curriculums({
				_id: '525cf20451979dea2c000001',
				name: 'New Curriculum'
			});

			// Mock Curriculum in scope
			scope.curriculum = sampleCurriculumPutData;

			// Set PUT response
			$httpBackend.expectPUT(/curriculums\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/curriculums/' + sampleCurriculumPutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid curriculumId and remove the Curriculum from the scope', inject(function(Curriculums) {
			// Create new Curriculum object
			var sampleCurriculum = new Curriculums({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Curriculums array and include the Curriculum
			scope.curriculums = [sampleCurriculum];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/curriculums\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleCurriculum);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.curriculums.length).toBe(0);
		}));
	});
}());