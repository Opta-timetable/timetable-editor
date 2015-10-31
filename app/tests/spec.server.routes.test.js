'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Spec = mongoose.model('Spec'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, spec;

/**
 * Spec routes tests
 */
describe('Spec CRUD tests', function() {
	beforeEach(function(done) {
		// Create user credentials
		credentials = {
			username: 'username',
			password: 'password'
		};

		// Create a new user
		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: credentials.username,
			password: credentials.password,
			provider: 'local'
		});

		// Save a user to the test db and create new Spec
		user.save(function() {
			spec = {
				name: 'Spec Name'
			};

			done();
		});
	});

	it('should be able to save Spec instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Spec
				agent.post('/specs')
					.send(spec)
					.expect(200)
					.end(function(specSaveErr, specSaveRes) {
						// Handle Spec save error
						if (specSaveErr) done(specSaveErr);

						// Get a list of Specs
						agent.get('/specs')
							.end(function(specsGetErr, specsGetRes) {
								// Handle Spec save error
								if (specsGetErr) done(specsGetErr);

								// Get Specs list
								var specs = specsGetRes.body;

								// Set assertions
								(specs[0].user._id).should.equal(userId);
								(specs[0].name).should.match('Spec Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Spec instance if not logged in', function(done) {
		agent.post('/specs')
			.send(spec)
			.expect(401)
			.end(function(specSaveErr, specSaveRes) {
				// Call the assertion callback
				done(specSaveErr);
			});
	});

	it('should not be able to save Spec instance if no name is provided', function(done) {
		// Invalidate name field
		spec.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Spec
				agent.post('/specs')
					.send(spec)
					.expect(400)
					.end(function(specSaveErr, specSaveRes) {
						// Set message assertion
						(specSaveRes.body.message).should.match('Please fill Spec name');
						
						// Handle Spec save error
						done(specSaveErr);
					});
			});
	});

	it('should be able to update Spec instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Spec
				agent.post('/specs')
					.send(spec)
					.expect(200)
					.end(function(specSaveErr, specSaveRes) {
						// Handle Spec save error
						if (specSaveErr) done(specSaveErr);

						// Update Spec name
						spec.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Spec
						agent.put('/specs/' + specSaveRes.body._id)
							.send(spec)
							.expect(200)
							.end(function(specUpdateErr, specUpdateRes) {
								// Handle Spec update error
								if (specUpdateErr) done(specUpdateErr);

								// Set assertions
								(specUpdateRes.body._id).should.equal(specSaveRes.body._id);
								(specUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Specs if not signed in', function(done) {
		// Create new Spec model instance
		var specObj = new Spec(spec);

		// Save the Spec
		specObj.save(function() {
			// Request Specs
			request(app).get('/specs')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Spec if not signed in', function(done) {
		// Create new Spec model instance
		var specObj = new Spec(spec);

		// Save the Spec
		specObj.save(function() {
			request(app).get('/specs/' + specObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', spec.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Spec instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Spec
				agent.post('/specs')
					.send(spec)
					.expect(200)
					.end(function(specSaveErr, specSaveRes) {
						// Handle Spec save error
						if (specSaveErr) done(specSaveErr);

						// Delete existing Spec
						agent.delete('/specs/' + specSaveRes.body._id)
							.send(spec)
							.expect(200)
							.end(function(specDeleteErr, specDeleteRes) {
								// Handle Spec error error
								if (specDeleteErr) done(specDeleteErr);

								// Set assertions
								(specDeleteRes.body._id).should.equal(specSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Spec instance if not signed in', function(done) {
		// Set Spec user 
		spec.user = user;

		// Create new Spec model instance
		var specObj = new Spec(spec);

		// Save the Spec
		specObj.save(function() {
			// Try deleting Spec
			request(app).delete('/specs/' + specObj._id)
			.expect(401)
			.end(function(specDeleteErr, specDeleteRes) {
				// Set message assertion
				(specDeleteRes.body.message).should.match('User is not logged in');

				// Handle Spec error error
				done(specDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Spec.remove().exec();
		done();
	});
});