'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Spec = mongoose.model('Spec');

/**
 * Globals
 */
var user, spec;

/**
 * Unit tests
 */
describe('Spec Model Unit Tests:', function() {
	beforeEach(function(done) {
		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: 'username',
			password: 'password'
		});

		user.save(function() { 
			spec = new Spec({
				name: 'Spec Name',
				user: user,
        specFile: '/this/is/a/test/path/file'
			});

			done();
		});
	});

	describe('Method Save', function() {
		it('should be able to save without problems', function(done) {
			return spec.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should be able to show an error when try to save without name', function(done) { 
			spec.name = '';

			return spec.save(function(err) {
				should.exist(err);
				done();
			});
		});

    it('should be able to show an error when try to save without specFile', function(done) {
      spec.specFile = '';

      return spec.save(function(err) {
        should.exist(err);
        done();
      });
    });
	});

	afterEach(function(done) { 
		Spec.remove().exec();
		User.remove().exec();

		done();
	});
});
