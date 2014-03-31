assert = require 'assert'
should = require 'should'
moment = require 'moment'

log = require 'winston'
log.remove log.transports.Console
log.add log.transports.Console,
    level: 'debug'
    colorize: true

utils = require './test-utils'


describe 'alerts-rest-tests', ->

    describe '/alerts/api/tags', ->
        it 'should return all tag values', (done) ->
            try
                utils.get '/alerts/api/tags', {}, (err, response, body) ->
                    should.not.exist err
                    should.exist body

                    should.exist body.length
                    body.length.should.be.greaterThan 0

                    utils.should_have_keys body, ['id', 'title', 'description', 'category']

                    done()
            catch e
                done e

    describe '/alerts/api/clients', ->
        it 'should return all client values', (done) ->
            utils.get '/alerts/api/clients', {}, (err, response, body) ->
                try
                    should.not.exist err
                    should.exist body
                    should.exist body.length
                    body.length.should.be.greaterThan 0

                    done()
                catch e
                    done e

    describe '/alerts/api/summary', ->
        it 'should return an unfiltered list of rollups', (done) ->
            utils.get '/alerts/api/summary', {}, (err, response, body) ->
                try
                    should.not.exist err
                    utils.should_be_list body, true
                    done()
                catch e
                    done e

    describe '/alerts/api/alerts', ->
        it 'should return an unfiltered list of alerts', (done) ->
            utils.get '/alerts/api/alerts', {}, (err, response, body) ->
                try
                    should.not.exist err
                    utils.should_be_list body, true
                    done()
                catch e
                    done e

