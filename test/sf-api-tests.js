var assert = require('assert');
var should = require('should');
var moment = require('moment');

// Setup underscore.
var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());

var api = require('sf-api');

var log = require('winston');
log.remove(log.transports.Console);
log.add(log.transports.Console, {
    level: 'debug',
    colorize: true
});


var ACQUISITION_UUID = 'c57b89b8-0de6-4df5-9a99-0afa1fbf09b4';


describe('sf-api-tests', function () {

    describe('#get_services()', function () {
        it('should return all services', function (done) {
            api.get_services({}, function (err, services) {
                try {
                    should.not.exist(err);
                    should.exist(services);
                    services.length.should.be.greaterThan(0);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('#get_clusters()', function () {
        it('should return clusters', function (done) {
            api.get_clusters({}, function (err, clusters) {
                try {
                    should.not.exist(err);
                    should.exist(clusters);
                    clusters.length.should.be.greaterThan(0);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('#get_acquisition_audit()', function () {
        it('should return an audit', function (done) {
            try {
                api.get_acquisition_audit(ACQUISITION_UUID, {}, function (err, audit) {
                    should.not.exist(err);
                    should.exist(audit);

                    console.dir(audit);

                    done();
                });
            }
            catch (e) {
                done(e);
            }
        });
    });

    describe('#add_host_metadata()', function () {
        it('should add host meta data', function () {
            var hosts = [
                {
                    time_logged: '2014-01-08T07:54:38.405931'
                }
            ];

            api.add_host_metadata(hosts);

            hosts.forEach(function (host) {
                console.dir(host);
            });
        });
    });

    describe('#get_acquisitions()', function () {
        it('should retrieve a list of acquisitions', function (done) {
            api.get_acquisitions({limit: 10}, {}, function (err, result) {
                try {
                    should.not.exist(err);
                    should.exist(result);
                    should.exist(result.objects);
                    result.objects.length.should.be.greaterThan(0);
                    result.objects.length.should.equal(10);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('#get_acquisitions_by_id()', function () {
        it('should retrieve a single host by id', function (done) {
            var uuid = 'ea14a714-8751-11e3-810c-5254000f6065';
            var ids = [
                uuid
            ];

            api.get_acquisitions_by_id(ids, {}, function (err, acquisitions) {
                try {
                    should.not.exist(err);
                    should.exist(acquisitions);
                    acquisitions.length.should.equal(1);
                    acquisitions[0].uuid.should.equal(uuid);

                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });

        it('should retrieve multiple hosts by id', function (done) {
            var uuid1 = 'ea14a714-8751-11e3-810c-5254000f6065';
            var uuid2 = 'c2a17c76-86dd-11e3-810c-5254000f6065';
            var ids = [
                uuid1,
                uuid2
            ];

            api.get_acquisitions_by_id(ids, {}, function (err, acquisitions) {
                try {
                    should.not.exist(err);
                    should.exist(acquisitions);
                    acquisitions.length.should.equal(2);

                    should.exist(_.findWhere(acquisitions, {uuid: uuid1}));
                    should.exist(_.findWhere(acquisitions, {uuid: uuid2}));

                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });
    });

});


