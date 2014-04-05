assert = require 'assert'
should = require 'should'
moment = require 'moment'

# Setup underscore.
_ = require 'underscore'
_.str = require 'underscore.string'
_.mixin _.str.exports()

utils = require './test-utils'
api = require 'alerts-api'

log = require 'winston'
log.remove log.transports.Console
log.add log.transports.Console,
    level: 'debug'
    colorize: true


describe 'alerts-api-tests', ->

    describe '#get_tags()', ->
        it 'should return all tag values', (done) ->
            api.get_tags (err, tags) ->
                try
                    should.not.exist err
                    should.exist tags
                    should.exist tags.length
                    tags.length.should.be.greaterThan 0

                    utils.should_have_keys tags, ['id', 'title', 'description', 'category']

                    done()
                catch e
                    done e

    describe '#get_clients()', ->
        it 'should return all clients', (done) ->
            api.get_clients {}, (err, clients) ->
                try
                    should.not.exist err
                    should.exist clients
                    should.exist clients.length
                    clients.length.should.be.greaterThan 0

                    utils.should_have_keys(clients, ['alias', 'name', 'uuid'])

                    done()
                catch e
                    done e

    describe '#get_alert_types()', ->
        it 'should return all alert types', (done) ->
            api.get_alert_types {}, (err, types) ->
                try
                    should.not.exist err
                    should.exist types
                    should.exist types.length
                    types.length.should.be.greaterThan 0

                    done()
                catch e
                    done e

    describe '#get_times()', ->
        it 'should return all time frame options', ->
            times = api.get_times()
            should.exist times
            should.exist times.length
            times.length.should.be.greaterThan 0
            for t in times
                should.exist t.id

    describe '#get_signature_summary()', ->
        it 'should return all signature summary records', (done) ->
            api.get_signature_summary {}, {}, (err, list) ->
                try
                    should.not.exist err
                    should.exist list
                    should.exist list.length
                    list.length.should.be.greaterThan 0

                    done()
                catch e
                    done e

    describe '#get_consolidated_signature_summary()', ->
        it 'should return ALL alert summary data', (done) ->
            api.get_consolidated_signature_summary {}, {}, (err, list) ->
                try
                    should.not.exist err
                    utils.should_be_list list, true

                    alert_types = []
                    device_types = []
                    for item in list
                        alert_types = _.union alert_types, item.alert_types
                        device_types = _.union device_types, item.device_types

                    console.dir alert_types
                    console.dir device_types

                    ('endpoint-match' in alert_types).should.be.true
                    ('HX' in device_types).should.be.true
                    ('NX' in device_types).should.be.true

                    done()
                catch e
                    done e

        it 'should return only endpoint-match data', (done) ->
            api.get_consolidated_signature_summary {alert_type: 'endpoint-match'}, {}, (err, list) ->
                try
                    should.not.exist err
                    utils.should_be_list list, true

                    for item in list
                        # Only endpoint-match records should be returned.
                        item.alert_types.length.should.equal 1
                        item.alert_types[0].should.equal 'endpoint-match'
                        # Only HX records should be returned.
                        item.device_types.length.should.equal 1
                        item.device_types[0].should.equal 'HX'
                    done()
                catch e
                    done e

        it 'should return only malware-callback data', (done) ->
            api.get_consolidated_signature_summary {alert_type: 'malware-callback'}, {}, (err, list) ->
                try
                    should.not.exist err
                    utils.should_be_list list, true

                    for item in list
                        item.alert_types.length.should.equal 1
                        ('malware-callback' in item.alert_types).should.be.true
                    done()
                catch e
                    done e

        it 'should return both endpoint-match and malware-callback data', (done) ->
            api.get_consolidated_signature_summary {alert_type: ['endpoint-match', 'malware-callback']}, {}, (err, list) ->
                try
                    should.not.exist err
                    utils.should_be_list list, true

                    for item in list
                        ('endpoint-match' in item.alert_types or 'malware-callback' in item.alert_types).should.be.true
                    done()
                catch e
                    done e

    describe '#get_alerts()', ->
        it 'should return all alerts for a signature', (done) ->
            api.get_alerts {signature_uuid: '18917a41-6975-47b6-99a2-839ec3911b9b'}, {}, (err, list) ->
                try
                    should.not.exist err
                    utils.should_be_list list
                    done()
                catch e
                    done e
        it 'should return all alerts for a iocnamehash', (done) ->
            api.get_alerts {iocnamehash: 'c5b06f2432c11bcf48a36cc057a018a7'}, {}, (err, list) ->
                try
                    should.not.exist err
                    utils.should_be_list list
                    done()
                catch e
                    done e

    describe '#get_alert()', ->
        it 'should return an alert for the specified uuid', (done) ->
            api.get_alert 'c4662926-2cae-45e1-b408-3f22d174724e', {}, (err, alert) ->
                try
                    should.not.exist err
                    should.exist alert
                    done()
                catch e
                    done e

    describe '#get_alert_content()', ->
        it 'should return alert content for the specified uuid', (done) ->
            api.get_alert_content 'c4662926-2cae-45e1-b408-3f22d174724e', {}, (err, content) ->
                try
                    should.not.exist err
                    should.exist content
                    done()
                catch e
                    done e