assert = require("assert")
should = require("should")
moment = require("moment")

# Setup underscore.
_ = require("underscore")
_.str = require("underscore.string")
_.mixin _.str.exports()

utils = require './test-utils.coffee'
api = require("sf-api")
log = require("winston")
log.remove log.transports.Console
log.add log.transports.Console,
    level: "debug"
    colorize: true

ACQUISITION_UUID = "c57b89b8-0de6-4df5-9a99-0afa1fbf09b4"
describe "sf-api-tests", ->
    describe "#get_services()", ->
        it "should return all services", (done) ->
            api.get_services {}, (err, services) ->
                try
                    should.not.exist err
                    should.exist services
                    services.length.should.be.greaterThan 0
                    done()
                catch e
                    done e
                return

            return

        return

    describe "#get_clusters()", ->
        it "should return clusters", (done) ->
            api.get_clusters {}, (err, clusters) ->
                try
                    should.not.exist err
                    should.exist clusters
                    clusters.length.should.be.greaterThan 0
                    done()
                catch e
                    done e
                return

            return

        return

    describe "#get_acquisition_audit()", ->
        it "should return an audit", (done) ->
            try
                api.get_acquisition_audit ACQUISITION_UUID, {}, (err, audit) ->
                    should.not.exist err
                    should.exist audit
                    console.dir audit
                    done()
                    return

            catch e
                done e
            return

        return

    describe "#add_host_metadata()", ->
        it "should add host meta data", ->
            hosts = [time_logged: "2014-01-08T07:54:38.405931"]
            api.add_host_metadata hosts
            hosts.forEach (host) ->
                console.dir host
                return

            return

        return

    describe "#get_acquisitions()", ->
        it "should retrieve a list of acquisitions", (done) ->
            api.get_acquisitions
                limit: 10
            , {}, (err, result) ->
                try
                    should.not.exist err
                    should.exist result
                    should.exist result.objects
                    result.objects.length.should.be.greaterThan 0
                    result.objects.length.should.equal 10
                    done()
                catch e
                    done e
                return

            return

        return

    describe "#get_acquisitions_by_id()", ->
        it "should retrieve a single host by id", (done) ->
            uuid = "ea14a714-8751-11e3-810c-5254000f6065"
            ids = [uuid]
            api.get_acquisitions_by_id ids, {}, (err, acquisitions) ->
                try
                    should.not.exist err
                    should.exist acquisitions
                    acquisitions.length.should.equal 1
                    acquisitions[0].uuid.should.equal uuid
                    done()
                catch e
                    done e
                return

            return

        it "should retrieve multiple hosts by id", (done) ->
            uuid1 = "ea14a714-8751-11e3-810c-5254000f6065"
            uuid2 = "c2a17c76-86dd-11e3-810c-5254000f6065"
            ids = [
                uuid1
                uuid2
            ]
            api.get_acquisitions_by_id ids, {}, (err, acquisitions) ->
                try
                    should.not.exist err
                    should.exist acquisitions
                    acquisitions.length.should.equal 2
                    should.exist _.findWhere(acquisitions,
                        uuid: uuid1
                    )
                    should.exist _.findWhere(acquisitions,
                        uuid: uuid2
                    )
                    done()
                catch e
                    done e
                return

            return

        return

    describe "#get_acquisitions_by_identity()", ->

        # TODO: Really should have a data fixture for this.
        it "should retrieve all acquisitions for an identity", (done) ->
            api.get_acqusitions_by_identity "f5d208501f298c13e40ab37aa8907af8", {}, (err, acquisitions) ->
                try
                    should.not.exist err
                    should.exist acquisitions
                    should.exist acquisitions.length
                    if acquisitions.length > 0
                        acquisitions.forEach (acquisition) ->

                            #console.dir(acquisition);
                            should.exist acquisition.uuid
                            should.exist acquisition.agent
                            should.exist acquisition.agent.hash
                            return

                    done()
                catch e
                    done e

    describe '#get_ioc_summary_v2()', ->
        it 'should retrieve all IOC summary records', (done) ->
            api.get_ioc_summary_v2 {}, {}, (err, list) ->
                try
                    should.not.exist err
                    utils.should_be_list list, true
                    utils.should_have_keys list, ['name', 'tags']
                    done()
                catch e
                    done e