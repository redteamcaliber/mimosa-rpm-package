var assert = require('assert');
var should = require('should');
var moment = require('moment');

// Setup underscore.
var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());

var uuid = require('node-uuid');
var api = require('uac-api');

var log = require('winston');
log.remove(log.transports.Console);
log.add(log.transports.Console, {
    level: 'debug',
    colorize: true
});


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
            api.get_identity_acquisitions_by_identity('invalidIdentity', function(err, collection) {
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
});