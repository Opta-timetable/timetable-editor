'use strict';

(function() {
	// Schools Controller Spec
	describe('Schools Controller Tests', function() {
		// Initialize global variables
		var SchoolsController,
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

			// Initialize the Schools controller.
			SchoolsController = $controller('SchoolsController', {
				$scope: scope
			});
		}));

		it('$scope.find() should create an array with at least one School object fetched from XHR', inject(function(Schools) {
			// Create sample School using the Schools service
			var sampleSchool = new Schools({
				name: 'New School'
			});

			// Create a sample Schools array that includes the new School
			var sampleSchools = [sampleSchool];

			// Set GET response
			$httpBackend.expectGET('schools').respond(sampleSchools);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.schools).toEqualData(sampleSchools);
		}));

		it('$scope.findOne() should create an array with one School object fetched from XHR using a schoolId URL parameter', inject(function(Schools) {
			// Define a sample School object
			var sampleSchool = new Schools({
				name: 'New School'
			});

			// Set the URL parameter
			$stateParams.schoolId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/schools\/([0-9a-fA-F]{24})$/).respond(sampleSchool);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.school).toEqualData(sampleSchool);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(Schools) {
			// Create a sample School object
			var sampleSchoolPostData = new Schools({
				name: 'New School'
			});

			// Create a sample School response
			var sampleSchoolResponse = new Schools({
				_id: '525cf20451979dea2c000001',
				name: 'New School'
			});

			// Fixture mock form input values
			scope.name = 'New School';

			// Set POST response
			$httpBackend.expectPOST('schools', sampleSchoolPostData).respond(sampleSchoolResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the School was created
			expect($location.path()).toBe('/schools/' + sampleSchoolResponse._id);
		}));

		it('$scope.update() should update a valid School', inject(function(Schools) {
			// Define a sample School put data
			var sampleSchoolPutData = new Schools({
				_id: '525cf20451979dea2c000001',
				name: 'New School'
			});

			// Mock School in scope
			scope.school = sampleSchoolPutData;

			// Set PUT response
			$httpBackend.expectPUT(/schools\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/schools/' + sampleSchoolPutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid schoolId and remove the School from the scope', inject(function(Schools) {
			// Create new School object
			var sampleSchool = new Schools({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Schools array and include the School
			scope.schools = [sampleSchool];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/schools\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleSchool);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.schools.length).toBe(0);
		}));
	});
}());