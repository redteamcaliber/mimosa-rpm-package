var UAC = UAC || {};


/**
 * Wait for a task to complete using a poll function to check whether we have reached an exit condition.
 * @param params - the parameters to send to the poll function.
 * @param poll_fn - function(params, callback(err, is_complete, result)).
 * @param completed_fn - function(err, is_complete, result)
 * @param options - delay=milliseconds in between poll attempts (default=2000), max_intervals=max number of poll attempts (default=5).
 */
UAC.wait_for = function (params, poll_fn, completed_fn, options) {
    var delay = 2000;
    var max_intervals = 5;

    // Override defaults.
    if (options) {
        if (options.delay) {
            delay = options.delay;
        }
        if (options.max_intervals) {
            max_intervals = options.max_intervals;
        }
    }

    // Set up the polling loop.
    var interval_count = 0;
    var timer_id = setInterval(function () {
        try {
            // Check for an exit condition.
            if (interval_count >= max_intervals) {
                // Exceed maximum number of tries.
                clearInterval(timer_id);
                completed_fn(null, false);
            }
            else {
                // Invoke the poll function.
                poll_fn(params, function (err, is_complete, result) {
                    if (err) {
                        // Error, exit.
                        clearInterval(timer_id);
                        completed_fn(err, false);
                    }
                    else if (is_complete) {
                        // Complete, exit.
                        clearInterval(timer_id);
                        completed_fn(null, true, result);
                    }
                    else {
                        // Increment the interval count.
                        interval_count = interval_count + 1;
                    }
                });
            }
        }
        catch (e) {
            // Error
            clearInterval(timer_id);
            completed_fn(e.stack ? e.stack : e);
        }
    }, delay);
};


//
// Display Blocking Functions.
//

/**
 * Retrieve the default block ui options.
 * @param message - the message to display.
 * @returns - the default options.
 */
UAC.get_blockui_options = function (message) {
    return {
        message: message ? message : '',
        css: {
            'margin-top': '50%',
            width: '100%',
            border: "0px solid #cccccc",
            padding: '0px',
            opacity: .8,
            backgroundColor: ''
        },
        overlayCSS: {
            backgroundColor: UAC.get_styles().overlay_color,
            opacity: .5
        },
        baseZ: 5000
    }
};

UAC.block = function (ev) {
    $.blockUI(UAC.get_blockui_options());
};

UAC.block_element_remove = function (el, message) {
    $(el).block(UAC.get_blockui_options('<img src="/static/img/ajax-loader.gif">'));
};

UAC.block_element = function (el, message) {
    $(el).block(UAC.get_blockui_options('<img src="/static/img/ajax-loader.gif">'));
};

UAC.unblock = function (el) {
    if (el) {
        $(el).unblock();
    }
    else {
        $.unblockUI();
    }
};

//$(document).ajaxStop($.unblockUI);

/**
 * Block the entire UI and run the function that invokes and AJAX action.  The UI should be unblocked after the AJAX
 * operation is completed.
 * @param fn - the function to run.  This function MUST invoke an operation.
 */
UAC.run = function (fn) {
    try {
        UAC.block();
        fn();
    }
    finally {
        UAC.unblock();
    }
};

UAC.show_views = function (views, on) {
    _.each(views, function (view) {
        if (on) {
            view.show();
        }
        else {
            view.hide();
        }
    });
};


//
// Growl Message Output.
//

UAC.display_info = function (message) {
    message = message ? message += '&nbsp;' : message;
    $.bootstrapGrowl(message, {
        type: 'info',
        width: 'auto',
        delay: 10000
    });
};

UAC.display_warn = function (message) {
    message = message ? message += '&nbsp;' : message;
    $.bootstrapGrowl(message, {
        type: 'warn',
        width: 'auto',
        delay: 10000
    });
};

UAC.display_success = function (message) {
    message = message ? message += '&nbsp;' : message;
    $.bootstrapGrowl(message, {
        type: 'success',
        width: 'auto',
        delay: 10000
    });
};

UAC.display_error = function (message) {
    message = message ? message += '&nbsp;' : message;
    $.bootstrapGrowl(message, {
        type: 'danger',
        width: 'auto',
        delay: 15000
    });
};

//
// Backbone Stuff.
//

/**
 * Override the default backbone POST behavior to send the CSRF token.
 */
var _sync = Backbone.sync;
Backbone.sync = function (method, model, options) {
    options.beforeSend = function (xhr) {
        var token = $('meta[name="csrf-token"]').attr('content');
        xhr.setRequestHeader('X-CSRF-Token', token);
    };
    return _sync(method, model, options);
};


//
// JQuery Stuff.
//

/**
 * Required to make jQuery drop the subscripts off of array parameters.
 */
jQuery.ajaxSettings.traditional = true;

//
// Date Formatting.
//

UAC.DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

UAC.format_date_string = function (s) {
    return s ? moment(s, 'YYYY-MM-DDTHH:mm:ss.SSS').format(UAC.DATE_FORMAT) : '';
};

UAC.format_unix_date = function (unix) {
    if (unix) {
        var input;
        if (typeof unix == 'string') {
            input = parseFloat(unix);
        }
        else {
            input = unix;
        }
        return moment.unix(input).format(UAC.DATE_FORMAT);
    }
    else {
        return '';
    }
};

function random_string(len) {
    if (!len) {
        len = 10;
    }
    var result = '';
    var charset = 'abcdefghijklmnopqrstuvwxyz';

    for (var i = 0; i < len; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return result;
}

/**
 * Add the default view helpers to the context.
 * @param context - the context.
 */
UAC.default_view_helpers = function(context) {
    if (context) {
        context.stringify = JSON.stringify;
        context.format_date = UAC.format_date_string;
    }
};

/**
 * Invoke a template.
 * @param template - the template name.
 * @param context - the template context.
 * @returns the template result.
 */
UAC.template = function(template, context) {
    if (!UAC.templates) {
        // Error, templates does not exist.
        throw 'UAC.templates is not initialized.';
    }
    else if (!(template in UAC.templates)) {
        // Error, template not found.
        throw 'UAC template: ' + template + ' not found.';
    }
    else {
        // Add the view helpers.
        UAC.default_view_helpers(context);

        // Return the template result.
        return UAC.templates[template](context);
    }
};

/**
 * Retrieve the UAC specific CSS styles.
 */
UAC.get_styles = function () {
    if (!UAC._styles) {
        UAC._styles = {};
        var body_style = window.getComputedStyle(document.body);
        if (body_style && body_style.getPropertyValue('background-color')) {
            UAC._styles.overlay_color = body_style.getPropertyValue('background-color')
        }
        else {
            UAC._styles.overlay_color = '#cccccc';
        }
//        var primary_style = window.getComputedStyle(document.getElementById('uac-primary-element'));
//        if (primary_style) {
//            if (primary_style.getPropertyValue('color')) {
//                UAC._styles.primary_color = primary_style.getPropertyValue('color');
//            }
//            else {
//                UAC._styles.primary_color = 'red';
//            }
//            if (primary_style.getPropertyValue('background-color')) {
//                UAC._styles.primary_background_color = primary_style.getPropertyValue('background-color');
//            }
//            else {
//                UAC._styles.primary_background_color = '#ffffff';
//            }
//        }
    }
    return UAC._styles;
};

/**
 * Clear the UAC CSS styles, will be recalculated on next usage.
 */
UAC.reset_styles = function () {
    UAC._styles = undefined;
};

/**
 * Change the current UAC theme.
 * @param theme - the theme name.
 */
UAC.set_theme = function (theme) {
    var url;
    if (!theme) {
        // Use the default.
        url = '/static/bootstrap/css/bootstrap-default.min.css';
    }
    else {
        // Generate the theme url.
        url = _.sprintf('/static/bootstrap/css/bootstrap.min-%s.css', theme);
    }
    // Reload the CSS.
    $('#bootstrap').attr('href', url);

    UAC.set_cookie({
        name: 'theme',
        value: theme,
        http_only: false,
        expires: moment().add('y', 1).utc()
    });

    // Clear the overlay color since the theme has been changed.
    UAC.reset_styles();
};

/**
 * Set a cookie.  Options available, name, value, path, domain, expires, secure, http_only.  domain defaults to the
 * server hostname, secure defaults to true, http_only defaults to true, expires defaults to null (session).
 */
UAC.set_cookie = function (options) {
    console.assert(options);
    console.assert(options.name);

    var name = options.name;
    var path = options.path || '/';
    var domain = options.domain || undefined;
    var expires = options.expires || 'null';
    var value = options.value || '';
    var secure = options.secure !== false;
    var http_only = options.http_only !== false;

    // Clear any old cookies.
    document.cookie = _.sprintf('%s=; expires=; path=%s; Secure;', name, path);

    // Set the new cookie.
    var cookie = _.sprintf('%s=%s; expires=%s; path=%s;', name, encodeURIComponent(value), expires, path);
    if (domain) {
        cookie += _.sprintf(' Domain=%s;', domain);
    }
    if (secure) {
        cookie += ' Secure;';
    }
    if (http_only) {
        cookie += ' HttpOnly;'
    }

    document.cookie = cookie;
};

UAC.get_cookies = function () {
    var cookie_string = document.cookie;
    if (cookie_string === '') {
        return {};
    }
    else {
        var results = {};
        _.each(cookie_string.split("; "), function (cookie) {
            var p = cookie.indexOf("=");
            var name = cookie.substring(0, p);
            var value = cookie.substring(p + 1);
            value = decodeURIComponent(value);
            results[name] = value;
        });
        return results;
    }
};

UAC.storage = function (k, o) {
    if (!window.localStorage) {
        log.warn('localStorage not available!');
        return {};
    }
    else if (arguments.length == 1) {
        var value = window.localStorage.getItem(k);
        return value ? JSON.parse(value) : undefined;
    }
    else if (arguments.length > 1) {
        if (o) {
            // Set the object.
            window.localStorage.setItem(k, JSON.stringify(o));
        }
        else {
            window.localStorage.removeItem(k);
        }
        return undefined;
    }
    else {
        var local = window.localStorage;
        return local ? JSON.parse(local) : {};
    }
};

/**
 * Store or retrieve and item from session storage.
 * @param k - the key (required).
 * @param o - the value (optional).
 * @returns the key value if only a key was specified.
 */
UAC.session = function (k, o) {
    if (!window.sessionStorage) {
        log.warn('sessionStorage not available!');
        return {};
    }
    else if (arguments.length == 1) {
        // Retrieve the object.
        var value = window.sessionStorage.getItem(k);
        return value ? JSON.parse(value) : undefined;
    }
    else if (arguments.length > 1) {
        if (o) {
            window.sessionStorage.setItem(k, JSON.stringify(o));
        }
        else {
            window.sessionStorage.removeItem(k);
        }
    }
    else {
        var session = window.sessionStorage;
        return session ? JSON.parse(session) : {};
    }
};

UAC.usersettings = function (options) {
    var usersettings = UAC.storage('usersettings');
    if (!usersettings) {
        usersettings = {};
    }
    if (options) {
        _.each(_.keys(options), function (key) {
            var value = options[key];
            if (value) {
                usersettings[key] = options[key];
            }
            else {
                delete usersettings[key];
            }
        });
        UAC.storage('usersettings', usersettings);
    }

    return usersettings ? usersettings : {};
};

/**
 *
 * @param options
 * @returns {*}
 */
UAC.recent = function (options) {
    // Retrieve the recent values from local storage.
    var value = UAC.storage('recent');
    var recent = value || [];

    if (options) {
        if (!Array.isArray(recent)) {
            // Recent should be an array.
            log.warn('Recent value is not of type array: ' + JSON.stringify(recent));
        }
        else if (!options.name || !options.type || !options.values) {
            // Options parameter is not valid.
            log.warn('Recent option is incomplete: ' + JSON.stringify(options));
        }
        else {
            // Keep track of the recent items.
            if (recent.length >= 10) {
                // Start removing the last element.
                recent.pop();
            }
            recent.unshift(options);

            // Update the list of recent values in local storage.
            UAC.storage('recent', recent);
        }
    }

    // Return the recent values.
    return recent;
};


//
// Common views.
//

/**
 * View to display and change the UAC theme.
 */
UAC.ThemeView = Backbone.View.extend({
    events: {
        'click a.uac-theme': 'on_theme_click'
    },
    on_theme_click: function (ev) {
        var view = this;
        var attr = ev.currentTarget.attributes;
        var theme_attr = attr['data-uac-theme'];
        if (theme_attr) {
            // Update the current theme.
            log.info('Setting UAC theme: ' + theme_attr.value);
            UAC.set_theme(theme_attr.value);
            view.$el.find('a.uac-theme').parent().removeClass('disabled');
            view.$el.find(_.sprintf('a.uac-theme[data-uac-theme=%s]', theme_attr.value)).parent().addClass('disabled');
        }
        else {
            // Error
            log.error('Unable to located theme attribute: ' + JSON.stringify(attr));
        }
    }
});

$( document ).ready(function() {
    (function () {
        // Create a theme view and tie it to the menu.
        new UAC.ThemeView({
            el: '#uac-user-nav'
        });
    })();
});
