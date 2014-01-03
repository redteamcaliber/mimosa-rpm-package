var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());

var settings = require('settings');
var log = require('winston');
var nunjucks = require('nunjucks');

/**
 * Utility method to load the application views.
 * @param app - the application instance.
 */
function load_views (app) {
    return nunjucks.configure('views', {
        autoescape: true,
        express: app
    });
}

var THEMES = {
    default: {
        id: 'default',
        name: 'Default'
    },
    default12: {
        id: 'default12',
        name: 'Default12'
    },
    amelia: {
        id: 'amelia',
        name: 'Amelia'
    },
    amelia12: {
        id: 'amelia12',
        name: 'Amelia12'
    },
    cerulean: {
        id: 'cerulean',
        name: 'Cerulean'
    },
    cerulean12: {
        id: 'cerulean12',
        name: 'Cerulean12'
    },
    cosmo: {
        id: 'cosmo',
        name: 'Cosmo'
    },
    cosmo13: {
        id: 'cosmo13',
        name: 'Cosmo13'
    },
    cyborg: {
        id: 'cyborg',
        name: 'Cyborg'
    },
    cyborg12: {
        id: 'cyborg12',
        name: 'Cyborg12'
    },
    flatly: {
        id: 'flatly',
        name: 'Flatly'
    },
    flatly13: {
        id: 'flatly13',
        name: 'Flatly13'
    },
    journal: {
        id: 'journal',
        name: 'Journal'
    },
    journal13: {
        id: 'journal13',
        name: 'Journal13'
    },
    simplex: {
        id: 'simplex',
        name: 'Simplex'
    },
    slate: {
        id: 'slate',
        name: 'Slate'
    },
    slate12: {
        id: 'slate12',
        name: 'Slate12'
    },
    spacelab: {
        id: 'spacelab',
        name: 'Spacelab'
    },
    spacelab12: {
        id: 'spacelab12',
        name: 'Spacelab12'
    },
    united: {
        id: 'united',
        name: 'United'
    },
    united12: {
        id: 'united12',
        name: 'United12'
    }
};

/**
 * Return the default context data to be passed to the views.
 * @param req - the application request.
 * @returns {{req: *, config: *}}
 */
function default_context(req) {
    // Add random data to the session for obfuscation.
    req.session.random = JSON.stringify(Math.random());

    var context = {
        uid: req.attributes ? req.attributes.uid : undefined,
        csrf_token: req.csrfToken(),
        settings: settings.get()
    };
    var cookie_theme = req.cookies.theme;

    context.themes = _.values(THEMES);

    if (_.keys(THEMES).indexOf(cookie_theme) != -1) {
        // Theme is valid.
        context.current_theme = cookie_theme
    }
    else {
        context.current_theme = 'default';
    }

    return context;
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

function send404(req, res, next) {
    var context = default_context(req);
    context.original_url = req.originalUrl;
    render_template(res, '/uac/404.html', context, next);
}

function send400(req, res, next, error) {
    var context = default_context(req);
    context.original_url = req.originalUrl;
    if (error) {
        context.error = error;
    }
    render_template(res, '/uac/400.html', context, next);
}

function send500(req, res, next, error) {
    var context = default_context(req);
    context.original_url = req.originalUrl;
    if (error) {
        context.error = error;
    }
    render_template(res, '/uac/500.html', context, next);
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

    //
    // Sorting
    if (req.query.iSortingCols && req.query.iSortingCols > 0) {
        // A sort column is specified.
        if (req.query['iSortCol_0']) {
            var sort_index = req.query['iSortCol_0'];
            var sort_name = _.sprintf('mDataProp_%s', sort_index);
            if (req.query[sort_name]) {
                // Add the sort column to the params.
                params.sort = req.query[sort_name];

                if (req.query['sSortDir_0']) {
                    // Add the order to the params.
                    params.order = req.query['sSortDir_0'];
                }
            }
        }
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

/**
 * Validate that all the properties specified are found in the list of values.  If validation fails send a HTTP 400
 * response and return false.
 * @param props - an array of property strings.
 * @param values - the dictionary of values.
 * @param res - the response.
 * @returns {{ok: boolean, message: string}}
 */
function validate_input(props, values, res) {
    var missing_props;
    var ok = true;

    if (Array.isArray(props)) {
        // List of properties.
        props.forEach(function(prop) {
            if (!_.has(values, prop)) {
                ok = false;
                if (missing_props) {
                    missing_props += ', ' + prop;
                }
                else {
                    missing_props = prop;
                }
            }
        });
    }
    else {
        // Single property.
        ok = _.has(values, props);
    }

    if (!ok) {
        // Send an invalid request response.
        res.send(400, _.sprintf('The following properties are required: ' + missing_props))
    }

    return ok;
}

function is_html_request(req) {
    return req.accepted && req.accepted.length > 0 && req.accepts('html') && !req.xhr;
}

function is_uuid(uuid) {
    return (uuid && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid));
}

exports.default_context = default_context;
exports.render_template = render_template;
exports.load_views = load_views;
exports.handle_response = handle_response;
exports.stringify = stringify;
exports.send = send;
exports.get_dt_request_params = get_dt_request_params;
exports.get_dt_response_params = get_dt_response_params;
exports.validate_input = validate_input;
exports.is_html_request = is_html_request;
exports.is_uuid = is_uuid;

exports.send404 = send404;
exports.send400 = send400;
exports.send500 = send500;