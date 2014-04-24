assert = require 'assert'
should = require 'should'
moment = require 'moment'

log = require 'winston'
log.remove log.transports.Console
log.add log.transports.Console,
    level: 'debug'
    colorize: true

utils = require './test-utils'
uac_api = require 'uac-api'


ALERT_UUID = 'c4662926-2cae-45e1-b408-3f22d174724e'


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

    describe "/alerts/api/alerts/#{ALERT_UUID}", ->
        it "should return the alert for #{ALERT_UUID}", (done) ->
            utils.get "/alerts/api/alerts/#{ALERT_UUID}", {}, (err, response, body) ->
                try
                    should.not.exist err
                    should.exist body
                    done()
                catch e
                    done e

    describe "/alerts/api/alerts/#{ALERT_UUID}/content", ->
        it "should return the alert content for #{ALERT_UUID}", (done) ->
            utils.get "/alerts/api/alerts/#{ALERT_UUID}/content", {}, (err, repsonse, body) ->
                try
                    should.not.exist err
                    should.exist body
                    done()
                catch e
                    done e

    describe "/alerts/api/alerts/#{ALERT_UUID}/full", ->
        it "should return the full alert and content for #{ALERT_UUID}", (done) ->
            utils.get "/alerts/api/alerts/#{ALERT_UUID}/full", {}, (err, response, body) ->
                try
                    should.not.exist err
                    should.exist body
                    done()
                catch e
                    done e

    describe "/alerts/api/alerts/#{ALERT_UUID}/activity", ->
        activity_uuid = undefined

        beforeEach (done) ->
            # Ensure an activity exists for the alert.
            uac_api.create_alert_tag_activity ALERT_UUID, 'escalate', {uid: 'anthony.milano@mandiant.com'}, (err, activity, alert_activity) ->
                try
                    should.not.exist err
                    should.exist activity
                    should.exist alert_activity
                    should.exist activity.get 'uuid'
                    activity_uuid = activity.get 'uuid'
                    done()
                catch e
                    done e

        it 'should return the related alerts activity', (done) ->
            utils.get '/alerts/api/alerts/c4662926-2cae-45e1-b408-3f22d174724e/activity', {}, (err, response, body) ->
                try
                    should.not.exist err
                    utils.should_be_list body

                    console.log "Found #{body.length} activity records for alert: #{ALERT_UUID}"
                    done()
                catch e
                    done e

        afterEach (done) ->
            if activity_uuid
                # Delete the test activity.
                uac_api.delete_activity activity_uuid, (err) ->
                    try
                        should.not.exist err
                        done()
                    catch e
                        done e
            else
                done()
