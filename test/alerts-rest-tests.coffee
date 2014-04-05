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
        it 'should return the list of alerts for a signature', (done) ->
            utils.get '/alerts/api/alerts', {signature_uuid: '18917a41-6975-47b6-99a2-839ec3911b9b'}, (err, response, body) ->
                try
                    should.not.exist err
                    utils.should_be_list body, true
                    done()
                catch e
                    done e

    describe '/alerts/api/alerts', ->
        it 'should return the list of alerts for a iocnamehash', (done) ->
            utils.get '/alerts/api/alerts', {iocnamehash: 'c5b06f2432c11bcf48a36cc057a018a7'}, (err, response, body) ->
                try
                    should.not.exist err
                    utils.should_be_list body, true
                    done()
                catch e
                    done e

    describe '/alerts/api/alerts/c4662926-2cae-45e1-b408-3f22d174724e', ->
        it 'should return the alert for c4662926-2cae-45e1-b408-3f22d174724e', (done) ->
            utils.get '/alerts/api/alerts/c4662926-2cae-45e1-b408-3f22d174724e', {}, (err, response, body) ->
                try
                    should.not.exist err
                    should.exist body
                    done()
                catch e
                    done e

    describe '/alerts/api/alerts/c4662926-2cae-45e1-b408-3f22d174724e/content', ->
        it 'should return the alert content for c4662926-2cae-45e1-b408-3f22d174724e', (done) ->
            utils.get '/alerts/api/alerts/c4662926-2cae-45e1-b408-3f22d174724e/content', {}, (err, repsonse, body) ->
                try
                    should.not.exist err
                    should.exist body
                    done()
                catch e
                    done e

    describe '/alerts/api/alerts/c4662926-2cae-45e1-b408-3f22d174724e/full', ->
        it 'should return the full alert and content for c4662926-2cae-45e1-b408-3f22d174724e', (done) ->
            utils.get '/alerts/api/alerts/c4662926-2cae-45e1-b408-3f22d174724e/full', {}, (err, response, body) ->
                try
                    should.not.exist err
                    should.exist body
                    done()
                catch e
                    done e
