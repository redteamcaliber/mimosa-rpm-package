var assert = require('assert');
var should = require('should');
var moment = require('moment');
var async = require('async');

var settings = require('settings');
var aes = require('aes');
var request = require('m-request');
var route_utils = require('route-utils');


var URL = 'https://uac.vm.mandiant.com';


describe('cluster-tests', function () {

    describe('#fork()', function () {
        it('should process a single block request...', function (done) {
            try {
                block_request(1, function(err, time) {
                    should.not.exist(err);
                    should.exist(time);
                    done();
                });
            }
            catch (e) {
                done(e);
            }
        });

        it('should process a 25 block requests...', function (done) {
            try {
                var requests = [];
                for (var i = 0; i < 25; i++) {
                    requests.push(undefined);
                }

                var total_time = 0;
                var index = 0;

                async.each(
                    requests,
                    function(request, callback) {
                        index++;
                        block_request(index, function(err, time) {
                            should.not.exist(err);
                            should.exist(time);

                            total_time += time;

                            callback();
                        });
                    },
                    function(err) {
                        should.not.exist(err);

                        console.log('Average request time: ' + (total_time / requests.length / 1000) + ' secs...');
                        console.log('Total request time: ' + (total_time / 1000)+ ' secs...');
                        done();
                    }
                );
            }
            catch (e) {
                done(e);
            }
        });
    });

});

/**
 * Execute a block request to the server.
 */
function block_request(index, callback) {
    console.log('Sending block request ' + index + '...');
    var start = Date.now();

    // Send a block request.
    get('/test/block', {}, function (err, response, body) {
        if (err) {
            // Error.
            callback(err);
        }
        else {
            // OK.
            var time = Date.now() - start;

            // Log the total request time as well as the actual server processing time.
            console.log('Processed block request ' + index + ' in ' + time + ' ms...' +
                ' (' + body.time + ')');

            // Return the total time it took to process the request.
            callback(null, time);
        }
    });
}

/**
 * Send a GET request.
 * @param path - the relative path.
 * @param params - the request parameters.
 * @param callback - function(err, body, response).
 */
function get(path, params, callback) {
    request.json_get(URL + path, params, null, callback);
}

/**
 * Send a POST request.
 * @param path - the relative path.
 * @param body - the POST body.
 * @param callback - function(err, body, response).
 */
function post(path, body, callback) {
    request.json_post(URL + path, {}, body, callback);
}

/**
 * Send a DELETE request.
 * @param path - the relative path.
 * @param uuid - the uuid to deleted.
 * @param callback - function(err, body, response).
 */
function del(path, uuid, callback) {
    request.json_delete(URL + path + '/' + uuid, {}, callback);
}