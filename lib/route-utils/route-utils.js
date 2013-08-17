var _ = require('underscore.string');
var settings = require('settings');
var log = require('log');
var nunjucks = require('nunjucks');

/**
 * Utility method to load the application views.
 * @param app - the application instance.
 */
exports.load_views = function (app) {
    try {
        var views = [
            {'directory': 'views'}
        ];
        var loaders = [];
        views.forEach(function (view) {
            log.debug('Loading view directory: %s', view.directory);
            loaders.push(new nunjucks.FileSystemLoader(view.directory));
        });
        var view_env = new nunjucks.Environment(loaders);
        view_env.express(app);
    }
    catch (e) {
        // Error
        log.error('ERROR: Unable to load application views, check the "uac:views" setting.');
        log.error(e.stack);
    }
};

/**
 * Return the default context data to be passed to the views.
 * @param req - the application request.
 * @returns {{req: *, config: *}}
 */
exports.default_context = function (req) {
    return {
        req: req,
        settings: settings.get()
    }
};

/**
 * Utility for the default handling of a response.
 * @param req
 * @param res
 * @param next
 * @returns {Function}
 */
exports.handle_response = function (req, res, next) {
    return function (err, result) {
        if (err) {
            next(err);
        }
        else {
            res.send(result);
        }
    }
};

/**
 * Combine to URL's ensure there are no extra slashes.
 * @param base_url - the base url.
 * @param relative_url - the relative url to append to it.
 * @returns {*} - the combined URL.
 */
exports.combine_urls = function (base_url, relative_url) {
    if (!_.endsWith(base_url, '/')) {
        if (_.startsWith(relative_url, '/')) {
            return base_url + relative_url;
        }
        else {
            return base_url + '/' + relative_url;
        }
    }
    else {
        if (_.startsWith(relative_url, '/')) {
            return base_url.substring(0, base_url.length - 1) + relative_url;
        }
        else {
            return base_url + relative_url;
        }
    }
};

exports.stringify = function (o) {
    return JSON.stringify(o, null, 4);
};