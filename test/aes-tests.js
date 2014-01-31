var assert = require('assert');
var should = require('should');
var moment = require('moment');

var settings = require('settings');
var aes = require('aes');
var route_utils = require('route-utils');

var KEY = settings.get('uac:encryption_secret');
var TEXT = 'ThisIsATest!';


describe('aes-tests', function () {

    describe('#encrypt()', function () {
        it('should encrypt a string without error', function () {
            var encrypted = aes.encrypt(KEY, TEXT);
            console.log('Encrypted text: ' + encrypted);
            should.exist(encrypted);
            encrypted.should.not.equal(TEXT);
        });
    });

    describe('#decrypt()', function () {
        it('should decrypt a string without error', function () {
            var encrypted = aes.encrypt(KEY, TEXT);
            should.exist(encrypted);
            var decrypted = aes.decrypt(KEY, encrypted);
            console.log('Decrypted text: ' + decrypted);
            should.exist(decrypted);
            decrypted.should.equal(TEXT);
        });
    });


    // Credential test values.
    var cluster = '12345';
    var user = 'user';
    var password = 'P@ssw0rd1';

    describe('#add_acquisition_credentials()', function() {
        it('should store credentials in the session encrypted', function() {
            var req = {
                session: {}
            };

            // Add the credentials to the session.
            route_utils.add_acquisition_credentials(req, cluster, user, password);

            // Dump the session.
            console.dir(req.session);

            // There should be a credential map in the session.
            var credential_map = req.session['acquisition_credentials'];
            should.exist(credential_map);

            // There should be an entry for the cluster in the credential map.
            var credentials = credential_map[cluster];
            should.exist(credentials);

            // The credentials should match the cluster.
            credentials.cluster_uuid.should.equal(cluster);
            // User should exist, the value is uniquely encrypted.
            should.exist(credentials.user);
            // Password should exist, the value is uniquely encrypted.
            should.exist(credentials.password);
        });

        describe('#get_acquisition_credentials()', function() {
            it('should retrieve the credentials from the session and decrypt them', function() {
                var req = {
                    session: {
                        acquisition_credentials: {
                        }
                    }
                };
                req.session.acquisition_credentials[cluster] = {
                    cluster_uuid: cluster,
                    user: aes.encrypt(KEY, user),
                    password: aes.encrypt(KEY, password)
                };

                console.dir(req.session);

                var credentials = route_utils.get_acquisition_credentials(req, cluster);

                should.exist(credentials);
                credentials.cluster_uuid.should.equal(cluster);
                credentials.user.should.equal(user);
                credentials.password.should.equal(password);
            });
        });
    });

});
