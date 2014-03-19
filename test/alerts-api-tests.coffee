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