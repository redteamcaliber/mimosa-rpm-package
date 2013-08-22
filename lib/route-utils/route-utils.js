var _ = require('underscore.string');
var settings = require('settings');
var log = require('log');
var nunjucks = require('nunjucks');

/**
 * Utility method to load the application views.
 * @param app - the application instance.
 */
function load_views (app) {
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
}

/**
 * Return the default context data to be passed to the views.
 * @param req - the application request.
 * @returns {{req: *, config: *}}
 */
function default_context (req) {
    return {
        req: req,
        csrf_token: req.session._csrf,
        settings: settings.get()
    }
}

/**
 * Render a template catching any errors that may occur.
 * @param res - the response.
 * @param template - the template path.
 * @param context - the template context.
 * @param next - the next instance.
 */
function render_template(res, template, context, next) {
    try {
        res.render(template, context);
    }
    catch (e) {
        // Error
        next(e);
    }
}

/**
 * Utility for the default handling of a response.
 * @param req
 * @param res
 * @param next
 * @returns {Function}
 */
function handle_response (req, res, next) {
    return err ? next(err) : res.send(result);
}

function stringify (o) {
    return JSON.stringify(o, null, 4);
}

/**
 * If there is not an error then send the JSON stringified version of the object to the response.
 * @param res - the response.
 * @param o - the object to send.
 * @returns {*}
 */
function send(res, o) {
    res.send(stringify(o));
}

function get_dt_request_params(req) {
    var params = {};
    if (req.query.iDisplayLength !== undefined) {
        params.limit = req.query.iDisplayLength;
    }
    else if (!req.query.limit !== undefined) {
        // If a limit was not supplied then assume all rows are returned.
        params.limit = 0;
    }
    if (req.query.iDisplayStart !== undefined) {
        params.offset = req.query.iDisplayStart;
    }
    return params;
}

function get_dt_response_params(results, count, offset, echo) {
    return {
        results: results,
        iTotalDisplayRecords: count,
        iTotalRecords: count,
        iDisplayStart: offset,
        sEcho: echo
    };
}

exports.default_context = default_context;
exports.render_template = render_template;
exports.load_views = load_views;
exports.handle_response = handle_response;
exports.stringify = stringify;
exports.send = send;
exports.get_dt_request_params = get_dt_request_params;
exports.get_dt_response_params = get_dt_response_params;