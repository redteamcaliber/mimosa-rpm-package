var StrikeFinder = StrikeFinder || {};

//
// StrikeFinder Utility Methods.
//

/**
 * Wait for a task to complete using a poll function to check whether we have reached an exit condition.
 * @param params - the parameters to send to the poll function.
 * @param poll_fn - function(params, callback(err, is_complete, result)).
 * @param completed_fn - function(err, is_complete, result)
 * @param options - delay=milliseconds in between poll attempts (default=2000), max_intervals=max number of poll attempts (default=5).
 */
StrikeFinder.wait_for = function (params, poll_fn, completed_fn, options) {
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
// Suppression Formatting Utilities.
//
StrikeFinder.format_suppression = function (s) {
    return _.sprintf('%s \'%s\' \'%s\' (preservecase=%s, negate: %s)',
        s.itemkey, s.condition, _.escape(s.itemvalue), s.preservecase, s.negate);
};

StrikeFinder.format_acquisition = function (a) {
    return _.sprintf('Acquisition (%s) FilePath: %s FileName: %s',
        a.uuid, a.file_path, a.file_name);
};


//
// Collapsable Utilities.
//

StrikeFinder.collapse = function (el) {
    jq_el = $(el);

    if (jq_el.hasClass('collapsable-header')) {
        new StrikeFinder.CollapsableContentView({
            el: '#' + jq_el.attr('id'),
            title: jq_el.attr('collapsable-title')
        });
    }
    _.each(jq_el.find('.collapsable-header'), function (collapsable) {
        new StrikeFinder.CollapsableContentView({
            el: collapsable,
            title: $(collapsable).attr('collapsable-title')
        });
    });
    if (jq_el.hasClass('collapsable')) {
        new StrikeFinder.CollapsableContentView({
            el: '#' + jq_el.attr('id'),
            title: jq_el.attr('collapsable-title'),
            display_toggle: false
        });
    }
    _.each(jq_el.find('.collapsable'), function (collapsable) {
        new StrikeFinder.CollapsableContentView({
            el: collapsable,
            title: $(collapsable).attr('collapsable-title'),
            display_toggle: false
        });
    });
};


//
// Display Blocking Functions.
//

/**
 * Retrieve the default block ui options.
 * @param message - the message to display.
 * @returns - the default options.
 */
StrikeFinder.get_blockui_options = function (message) {
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

StrikeFinder.block = function (ev) {
    $.blockUI(StrikeFinder.get_blockui_options());
};

StrikeFinder.block_element_remove = function (el, message) {
    $(el).block(StrikeFinder.get_blockui_options('<img src="/static/img/ajax-loader.gif">'));
};

StrikeFinder.block_element = function (el, message) {
    $(el).block(StrikeFinder.get_blockui_options('<img src="/static/img/ajax-loader.gif">'));
};

StrikeFinder.unblock = function (el) {
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
StrikeFinder.run = function (fn) {
    try {
        StrikeFinder.block();
        fn();
    }
    finally {
        StrikeFinder.unblock();
    }
};

StrikeFinder.show_views = function (views, on) {
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

StrikeFinder.display_info = function (message) {
    message = message ? message += '&nbsp;' : message;
    $.bootstrapGrowl(message, {
        type: 'info',
        width: 'auto',
        delay: 10000
    });
};

StrikeFinder.display_warn = function (message) {
    message = message ? message += '&nbsp;' : message;
    $.bootstrapGrowl(message, {
        type: 'warn',
        width: 'auto',
        delay: 10000
    });
};

StrikeFinder.display_success = function (message) {
    message = message ? message += '&nbsp;' : message;
    $.bootstrapGrowl(message, {
        type: 'success',
        width: 'auto',
        delay: 10000
    });
};

StrikeFinder.display_error = function (message) {
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

//$(document).ajaxError(function (collection, response, options) {
//
//    //console.dir(collection);
//    //console.dir(response);
//    //console.dir(options);
//
//    if (response) {
//        if (response.status == 307) {
//            // No session? TODO
//            console.dir('Redirecting to login...');
//            window.location = document.URL;
//        }
//        else {
//            if (!('abort' == response.statusText) && re) {
//                // Error
//                StrikeFinder.display_error("An error has occurred while processing your request: " + response.responseText);
//            }
//        }
//    }
//    else {
//        log.warning("Error during processing, response is invalid");
//    }
//});
//$.ajaxSetup({
//      timeout: 180000
//});


//
// Date Formatting.
//

StrikeFinder.DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

StrikeFinder.format_date_string = function (s) {
    return s ? moment(s, 'YYYY-MM-DDTHH:mm:ss.SSS').format(StrikeFinder.DATE_FORMAT) : '';
};

StrikeFinder.format_unix_date = function (unix) {
    if (unix) {
        var input;
        if (typeof unix == 'string') {
            input = parseFloat(unix);
        }
        else {
            input = unix;
        }
        return moment.unix(input).format(StrikeFinder.DATE_FORMAT);
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

function format_expression(s) {
    console.log(s);
    s = s.trim();
    var starts_with_parend = _.startsWith(s, '(');
    var ends_with_parend = _.endsWith(s, ')');
    if (starts_with_parend && ends_with_parend) {
        console.log(s.substring(1, s.length - 1));
        return format_expression(s.substring(1, s.length - 1));
    }
    else {
        return s;
    }
}

/**
 * Invoke a template.
 * @param template - the template name.
 * @param context - the template context.
 * @returns the template result.
 */
StrikeFinder.template = function (template, context) {
    if (!StrikeFinder.templates) {
        // Error, templates does not exist.
        log.error('StrikeFinder.templates is not initialized.');
    }
    else if (!(template in StrikeFinder.templates)) {
        // Error, template not found.
        log.error('StrikeFinder template: ' + template + ' not found.');
    }
    else {
        // Return the template result.

        if (context) {
            // Add in the view helpers.
            context.format_date = StrikeFinder.format_date_string;
        }

        return StrikeFinder.templates[template](context);
    }
}