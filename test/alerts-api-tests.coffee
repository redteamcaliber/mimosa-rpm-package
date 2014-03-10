assert = require 'assert'
should = require 'should'
moment = require 'moment'

# Setup underscore.
_ = require 'underscore'
_.str = require 'underscore.string'
_.mixin _.str.exports()

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
                should.not.exist err
                should.exist tags
                should.exist tags.length
                tags.length.should.be.greaterThan 0
                done()

    describe '#get_clients()', ->
        it 'should return all clients', (done) ->
            api.get_clients (err, clients) ->
                should.not.exist err
                should.exist clients
                should.exist clients.length
                clients.length.should.be.greaterThan 0
                for client in clients
                    should.exist client.uuid
                    should.exist client.name
                done()

    describe '#get_alert_types()', ->
        it 'should return all alert types', (done) ->
            api.get_alert_types (err, types) ->
                should.not.exist err
                should.exist types
                should.exist types.length
                types.length.should.be.greaterThan 0
                for type in types
                    should.exist type.uuid
                    should.exist type.title
                done()

    describe '#get_timeframes()', ->
        it 'should return all timeframe options', ->
            timeframes = api.get_timeframes()
            should.exist timeframes
            should.exist timeframes.length
            timeframes.length.should.be.greaterThan 0
            for t in timeframes
                should.exist t.id