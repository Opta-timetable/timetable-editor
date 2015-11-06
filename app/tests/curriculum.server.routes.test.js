'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Curriculum = mongoose.model('Curriculum'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, curriculum;

/**
 * Curriculum routes tests
 */
describe('Curriculum CRUD tests', function() {
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

		// Save a user to the test db and create new Curriculum
		user.save(function() {
			curriculum = {
				name: 'Curriculum Name'
			};

			done();
		});
	});

	it('should be able to save Curriculum instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Curriculum
				agent.post('/curriculums')
					.send(curriculum)
					.expect(200)
					.end(function(curriculumSaveErr, curriculumSaveRes) {
						// Handle Curriculum save error
						if (curriculumSaveErr) done(curriculumSaveErr);

						// Get a list of Curriculums
						agent.get('/curriculums')
							.end(function(curriculumsGetErr, curriculumsGetRes) {
								// Handle Curriculum save error
								if (curriculumsGetErr) done(curriculumsGetErr);

								// Get Curriculums list
								var curriculums = curriculumsGetRes.body;

								// Set assertions
								(curriculums[0].user._id).should.equal(userId);
								(curriculums[0].name).should.match('Curriculum Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Curriculum instance if not logged in', function(done) {
		agent.post('/curriculums')
			.send(curriculum)
			.expect(401)
			.end(function(curriculumSaveErr, curriculumSaveRes) {
				// Call the assertion callback
				done(curriculumSaveErr);
			});
	});

	it('should not be able to save Curriculum instance if no name is provided', function(done) {
		// Invalidate name field
		curriculum.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Curriculum
				agent.post('/curriculums')
					.send(curriculum)
					.expect(400)
					.end(function(curriculumSaveErr, curriculumSaveRes) {
						// Set message assertion
						(curriculumSaveRes.body.message).should.match('Please fill Curriculum name');
						
						// Handle Curriculum save error
						done(curriculumSaveErr);
					});
			});
	});

	it('should be able to update Curriculum instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Curriculum
				agent.post('/curriculums')
					.send(curriculum)
					.expect(200)
					.end(function(curriculumSaveErr, curriculumSaveRes) {
						// Handle Curriculum save error
						if (curriculumSaveErr) done(curriculumSaveErr);

						// Update Curriculum name
						curriculum.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Curriculum
						agent.put('/curriculums/' + curriculumSaveRes.body._id)
							.send(curriculum)
							.expect(200)
							.end(function(curriculumUpdateErr, curriculumUpdateRes) {
								// Handle Curriculum update error
								if (curriculumUpdateErr) done(curriculumUpdateErr);

								// Set assertions
								(curriculumUpdateRes.body._id).should.equal(curriculumSaveRes.body._id);
								(curriculumUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Curriculums if not signed in', function(done) {
		// Create new Curriculum model instance
		var curriculumObj = new Curriculum(curriculum);

		// Save the Curriculum
		curriculumObj.save(function() {
			// Request Curriculums
			request(app).get('/curriculums')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Curriculum if not signed in', function(done) {
		// Create new Curriculum model instance
		var curriculumObj = new Curriculum(curriculum);

		// Save the Curriculum
		curriculumObj.save(function() {
			request(app).get('/curriculums/' + curriculumObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', curriculum.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Curriculum instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Curriculum
				agent.post('/curriculums')
					.send(curriculum)
					.expect(200)
					.end(function(curriculumSaveErr, curriculumSaveRes) {
						// Handle Curriculum save error
						if (curriculumSaveErr) done(curriculumSaveErr);

						// Delete existing Curriculum
						agent.delete('/curriculums/' + curriculumSaveRes.body._id)
							.send(curriculum)
							.expect(200)
							.end(function(curriculumDeleteErr, curriculumDeleteRes) {
								// Handle Curriculum error error
								if (curriculumDeleteErr) done(curriculumDeleteErr);

								// Set assertions
								(curriculumDeleteRes.body._id).should.equal(curriculumSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Curriculum instance if not signed in', function(done) {
		// Set Curriculum user 
		curriculum.user = user;

		// Create new Curriculum model instance
		var curriculumObj = new Curriculum(curriculum);

		// Save the Curriculum
		curriculumObj.save(function() {
			// Try deleting Curriculum
			request(app).delete('/curriculums/' + curriculumObj._id)
			.expect(401)
			.end(function(curriculumDeleteErr, curriculumDeleteRes) {
				// Set message assertion
				(curriculumDeleteRes.body.message).should.match('User is not logged in');

				// Handle Curriculum error error
				done(curriculumDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Curriculum.remove().exec();
		done();
	});
});