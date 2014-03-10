assert = require 'assert'
should = require 'should'
moment = require 'moment'

log = require 'winston'
log.remove log.transports.Console
log.add log.transports.Console,
    level: 'debug'
    colorize: true

request = require 'm-request'

URL = 'https://uac.vm.mandiant.com'

describe 'alerts-rest-tests', ->

    describe '/alerts/api/tags', ->
        it 'should return all tag values', (done) ->
            try
                get '/alerts/api/tags', {}, (err, response, body) ->
                    should.not.exist err
                    should.exist body

                    should.exist body.length
                    body.length.should.be.greaterThan 0

                    required_keys = ['id', 'title', 'description', 'category']
                    for tag in body
                        for required in required_keys
                            should.exist tag[required]

                    done()
            catch e
                done(e)

###
    Send a GET request.

    Params:
        path - the relative path.
        params - the request parameters.
        callback - function(err, body, response).
###
get = (path, params, callback) ->
    request.json_get(URL + path, params, null, callback)

###
    Send a POST request.

    Params:
        path - the relative path.
        body - the POST body.
        callback - function(err, body, response).
###
post = (path, body, callback) ->
    request.json_post(URL + path, {}, body, callback)


###
    Send a DELETE request.

    Params:
        path - the relative path.
        uuid - the uuid to deleted.
        callback - function(err, body, response).
###
del = (path, uuid, callback) ->
    request.json_delete(URL + path + '/' + uuid, {}, callback)