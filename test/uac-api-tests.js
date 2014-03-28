var assert = require('assert');
var should = require('should');
var moment = require('moment');

// Setup underscore.
var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());

var settings = require('settings');
var uuid = require('node-uuid');
var api = require('uac-api');

var log = require('winston');
log.remove(log.transports.Console);
log.add(log.transports.Console, {
    level: 'debug',
    colorize: true
});


var mcube_timeout = settings.get('uac:mcube_api_timeout');

// An MD5 that is not detected by AV.
var UNDETECTED_MD5 = '681b80f1ee0eb1531df11c6ae115d711';
var DETECTED_MD5 = 'c100bde0c1e0d7e77dcbc6e00bc165f3';


describe('uac-api-tests', function () {

    describe('#get_ioc_terms()', function () {
        it('should return all ioc terms for ArpEntryItem', function (done) {
            api.get_ioc_terms('ArpEntryItem', function (err, terms) {
                try {
                    should.not.exist(err);
                    should.exist(terms);
                    terms.length.should.equal(4);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });

        it('should return all ioc terms for DiskItem', function (done) {
            api.get_ioc_terms('DiskItem', function (err, terms) {
                try {
                    should.not.exist(err);
                    should.exist(terms);
                    terms.length.should.equal(6);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('#create_identity_acquisition()', function () {
        var identity_acquisition_uuid;
        var acquisition_uuid = uuid.v4();
        var user_uuid = uuid.v4();
        var uid = 'Anthony.Milano@Mandiant.com';

        it('should create an identity acquisition record', function (done) {
            api.create_idenity_acquisition(
                'TestIdentity',
                acquisition_uuid,
                user_uuid,
                uid,
                function (err, model) {
                    try {
                        done();

                        should.not.exist(err);
                        should.exist(model);

                        var attributes = model.attributes;
                        should.exist(attributes);
                        should.exist(attributes.uuid);
                        attributes.acquisition_uuid.should.equal(acquisition_uuid);
                        attributes.user_uuid.should.equal(user_uuid);
                        attributes.uid.should.equal(uid);

                        // Save the uuid in order to delete.
                        identity_acquisition_uuid = attributes.uuid;
                    }
                    catch (e) {
                        console.dir(model);
                        done(e);
                    }
                });
        });

        after(function (done) {
            if (identity_acquisition_uuid) {
                // Delete the identity acquisition record.
                api.delete_identity_acquisition(identity_acquisition_uuid, function (err) {
                    should.not.exist(err);
                });
            }
            done();
        });
    });

    describe('#get_identity_acquisitions_by_identity', function () {
        it('should return an empty collection for an invalid identity', function (done) {
            api.get_identity_acquisitions_by_identity('invalidIdentity', function (err, collection) {
                try {
                    should.not.exist(err);
                    should.exist(collection);
                    collection.length.should.equal(0);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('#get_vt_details()', function () {
        this.timeout(mcube_timeout);

        var url;
        before(function() {
            url = settings.get('uac:mcube_api_url');
        });

        it('should return null when the MD5 sample does not exist', function (done) {
            api.get_vt_details(UNDETECTED_MD5, function (err, result) {
                should.not.exist(err);
                should.exist(result);
                should.exist(result.md5);
                should.exist(result.found)
                result.found.should.equal(false);
                done();
            });
        });

        it('should return detected details when the sample', function (done) {
            api.get_vt_details(DETECTED_MD5, function (err, result) {
                should.not.exist(err);
                should.exist(result);

                assert_vt_details(result, true);

                done();
            });
        });

        it('should return an err when there is a configuration error', function(done) {
            var invalid_url = 'invalidurl!';
            settings.set('uac:mcube_api_url', invalid_url);
            should.equal(invalid_url, settings.get('uac:mcube_api_url'));

            api.get_vt_details(DETECTED_MD5, function (err, result) {
                should.exist(err);
                should.not.exist(result);

                done();
            });
        });

        afterEach(function() {
            settings.set('uac:mcube_api_url', url);
        });
    });

    describe('#get_md5_details()', function () {
        this.timeout(3000);

        var url;
        before(function() {
            url = settings.get('uac:mcube_api_url');
        });

        it('should return null vt when the sample does not exist', function (done) {
            api.get_md5_details(UNDETECTED_MD5, function (err, result) {
                should.not.exist(err);
                should.exist(result);

                // vt should be in the result.
                should.not.exist(result.vt_err);
                should.equal(true, 'vt' in result);

                // Should be reported that the item was not found.
                result.vt.found.should.equal(false);

                done();
            });
        });

        it('should return vt detected details for a detected sample', function (done) {
            api.get_md5_details(DETECTED_MD5, function (err, result) {
                should.not.exist(err);
                should.exist(result);

                should.not.exist(result.vt_err);
                should.exist(result.vt);
                assert_vt_details(result.vt, true);

                done();
            });
        });

        it('does what?', function(done) {
            api.get_md5_details('4718d26a8072a7db42c75f588b0ca38f', function (err, result) {
                should.not.exist(err);
                should.exist(result);

                should.not.exist(result.vt_err);
                should.exist(result.vt);
                assert_vt_details(result.vt, true);

                done();
            });
        });

        afterEach(function() {
            settings.set('uac:mcube_api_url', url);
        });
    });
});

function assert_vt_details(result, is_detected) {
    // Assert the meta data.
    should.exist(result.md5);
    should.exist(result.sha1);
    should.exist(result.count);
    result.count.should.be.greaterThan(0);

    // Assert the detected details.
    should.exist(result.detected);
    should.exist(result.detected.length);
    result.detected.length.should.be.greaterThan(0);
    var found_detected = false;
    result.detected.forEach(function (detected) {
        should.exist(detected.detected);
        // Version can be null.
        //should.exist(detected.version);
        should.exist(detected.update);
        should.exist(detected.antivirus);

        if (detected.detected) {
            found_detected = true;
        }
    });
    // Should have found at least one item that was detected.
    found_detected.should.equal(is_detected);
}