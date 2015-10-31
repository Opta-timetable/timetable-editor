'use strict';

(function() {
	// Specs Controller Spec
	describe('Specs Controller Tests', function() {
		// Initialize global variables
		var SpecsController,
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

			// Initialize the Specs controller.
			SpecsController = $controller('SpecsController', {
				$scope: scope
			});
		}));

		it('$scope.find() should create an array with at least one Spec object fetched from XHR', inject(function(Specs) {
			// Create sample Spec using the Specs service
			var sampleSpec = new Specs({
				name: 'New Spec'
			});

			// Create a sample Specs array that includes the new Spec
			var sampleSpecs = [sampleSpec];

			// Set GET response
			$httpBackend.expectGET('specs').respond(sampleSpecs);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.specs).toEqualData(sampleSpecs);
		}));

		it('$scope.findOne() should create an array with one Spec object fetched from XHR using a specId URL parameter', inject(function(Specs) {
			// Define a sample Spec object
			var sampleSpec = new Specs({
				name: 'New Spec'
			});

			// Set the URL parameter
			$stateParams.specId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/specs\/([0-9a-fA-F]{24})$/).respond(sampleSpec);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.spec).toEqualData(sampleSpec);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(Specs) {
			// Create a sample Spec object
			var sampleSpecPostData = new Specs({
				name: 'New Spec'
			});

			// Create a sample Spec response
			var sampleSpecResponse = new Specs({
				_id: '525cf20451979dea2c000001',
				name: 'New Spec'
			});

			// Fixture mock form input values
			scope.name = 'New Spec';

			// Set POST response
			$httpBackend.expectPOST('specs', sampleSpecPostData).respond(sampleSpecResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the Spec was created
			expect($location.path()).toBe('/specs/' + sampleSpecResponse._id);
		}));

		it('$scope.update() should update a valid Spec', inject(function(Specs) {
			// Define a sample Spec put data
			var sampleSpecPutData = new Specs({
				_id: '525cf20451979dea2c000001',
				name: 'New Spec'
			});

			// Mock Spec in scope
			scope.spec = sampleSpecPutData;

			// Set PUT response
			$httpBackend.expectPUT(/specs\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/specs/' + sampleSpecPutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid specId and remove the Spec from the scope', inject(function(Specs) {
			// Create new Spec object
			var sampleSpec = new Specs({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Specs array and include the Spec
			scope.specs = [sampleSpec];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/specs\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleSpec);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.specs.length).toBe(0);
		}));
	});
}());