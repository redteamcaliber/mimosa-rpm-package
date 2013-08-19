var _ = require('underscore.string');
var pg = require('pg');

var settings = require('settings');
var log = require('log');
var request = require('m-request');
var route_utils = require('route-utils');


function get_callback_url(req, relative_url) {
    var base_url = req.protocol + '://' + req.host + ':' + settings.get('server:port');
    return route_utils.combine_urls(base_url, relative_url);
}

function get_connection_string() {
    var user = settings.get('uac:db_user');
    var pass = settings.get('uac:db_pass');
    var host = settings.get('uac:db_host');
    var port = settings.get('uac:db_port');
    var name = settings.get('uac:db_name');
    return _.sprintf('postgres://%s:%s@%s:%s/%s', user, pass, host, port, name);
}

exports.get_ioc_terms = function(type, callback) {
    pg.connect(get_connection_string(), function (err, client, done) {
        if (err) {
            // Error.
            err = 'Error: error while obtaining database connection: ' + e;
        }
        var sql = 'select uuid, data_type, source, text, text_prefix, title\n' +
            'from iocterms where text_prefix=$1 order by title';
        client.query(sql, [type], function (err, result) {
            try {
                callback(err, result.rows);
            }
            catch (e) {
                // Error
                log.error('Exception while running callback during get_ioc_terms.');
                log.error(e.stack);
            }
            finally {
                // Release the connection.
                done();
            }
        });
    });
};

exports.get_test = function(req, callback) {
    request.json_get(req, get_callback_url(req, '/test'), {}, callback);
};