assert = require 'assert'
should = require 'should'
moment = require 'moment'

log = require 'winston'
log.remove log.transports.Console
log.add log.transports.Console,
    level: 'debug'
    colorize: true

utils = require './test-utils'


describe 'sf-rest-tests', ->

    describe '/sf/api/summary', ->
        it 'should return all alert summary items', (done) ->
            try
                utils.get '/sf/api/summary', {}, (err, response, body) ->
                    should.not.exist err
                    utils.should_be_list body
                    done()
            catch e
                done e
