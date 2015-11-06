'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Subject = mongoose.model('Subject'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, subject;

/**
 * Subject routes tests
 */
describe('Subject CRUD tests', function() {
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

		// Save a user to the test db and create new Subject
		user.save(function() {
			subject = {
				name: 'Subject Name'
			};

			done();
		});
	});

	it('should be able to save Subject instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Subject
				agent.post('/subjects')
					.send(subject)
					.expect(200)
					.end(function(subjectSaveErr, subjectSaveRes) {
						// Handle Subject save error
						if (subjectSaveErr) done(subjectSaveErr);

						// Get a list of Subjects
						agent.get('/subjects')
							.end(function(subjectsGetErr, subjectsGetRes) {
								// Handle Subject save error
								if (subjectsGetErr) done(subjectsGetErr);

								// Get Subjects list
								var subjects = subjectsGetRes.body;

								// Set assertions
								(subjects[0].user._id).should.equal(userId);
								(subjects[0].name).should.match('Subject Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Subject instance if not logged in', function(done) {
		agent.post('/subjects')
			.send(subject)
			.expect(401)
			.end(function(subjectSaveErr, subjectSaveRes) {
				// Call the assertion callback
				done(subjectSaveErr);
			});
	});

	it('should not be able to save Subject instance if no name is provided', function(done) {
		// Invalidate name field
		subject.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Subject
				agent.post('/subjects')
					.send(subject)
					.expect(400)
					.end(function(subjectSaveErr, subjectSaveRes) {
						// Set message assertion
						(subjectSaveRes.body.message).should.match('Please fill Subject name');
						
						// Handle Subject save error
						done(subjectSaveErr);
					});
			});
	});

	it('should be able to update Subject instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Subject
				agent.post('/subjects')
					.send(subject)
					.expect(200)
					.end(function(subjectSaveErr, subjectSaveRes) {
						// Handle Subject save error
						if (subjectSaveErr) done(subjectSaveErr);

						// Update Subject name
						subject.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Subject
						agent.put('/subjects/' + subjectSaveRes.body._id)
							.send(subject)
							.expect(200)
							.end(function(subjectUpdateErr, subjectUpdateRes) {
								// Handle Subject update error
								if (subjectUpdateErr) done(subjectUpdateErr);

								// Set assertions
								(subjectUpdateRes.body._id).should.equal(subjectSaveRes.body._id);
								(subjectUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Subjects if not signed in', function(done) {
		// Create new Subject model instance
		var subjectObj = new Subject(subject);

		// Save the Subject
		subjectObj.save(function() {
			// Request Subjects
			request(app).get('/subjects')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Subject if not signed in', function(done) {
		// Create new Subject model instance
		var subjectObj = new Subject(subject);

		// Save the Subject
		subjectObj.save(function() {
			request(app).get('/subjects/' + subjectObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', subject.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Subject instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Subject
				agent.post('/subjects')
					.send(subject)
					.expect(200)
					.end(function(subjectSaveErr, subjectSaveRes) {
						// Handle Subject save error
						if (subjectSaveErr) done(subjectSaveErr);

						// Delete existing Subject
						agent.delete('/subjects/' + subjectSaveRes.body._id)
							.send(subject)
							.expect(200)
							.end(function(subjectDeleteErr, subjectDeleteRes) {
								// Handle Subject error error
								if (subjectDeleteErr) done(subjectDeleteErr);

								// Set assertions
								(subjectDeleteRes.body._id).should.equal(subjectSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Subject instance if not signed in', function(done) {
		// Set Subject user 
		subject.user = user;

		// Create new Subject model instance
		var subjectObj = new Subject(subject);

		// Save the Subject
		subjectObj.save(function() {
			// Try deleting Subject
			request(app).delete('/subjects/' + subjectObj._id)
			.expect(401)
			.end(function(subjectDeleteErr, subjectDeleteRes) {
				// Set message assertion
				(subjectDeleteRes.body.message).should.match('User is not logged in');

				// Handle Subject error error
				done(subjectDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Subject.remove().exec();
		done();
	});
});