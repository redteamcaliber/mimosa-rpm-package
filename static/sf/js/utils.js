var StrikeFinder = StrikeFinder || {};

//
// StrikeFinder Utility Methods.
//


//
// Task Utilities.
//

/**
 * Wait for a task result to complete polling fn(callback) until done is true.  A callback is passed into fn() to
 * specify that the process is completed invoke callback(true) or callback(false) otherwise.
 * @param task_id - the task to wait for.
 * @param callback - function(err, complete).
 * @param options - delay - optional delay in milliseconds.  Defaults to 2000.
 *                  max_intervals - the maximum number of intervals.  Defaults to 5.
 */
StrikeFinder.wait_for_task = function(task_id, callback, options) {
    var result = false;
    var delay = 2000;
    var max_intervals = 5;

    if (options) {
        if (options.delay) {
            delay = options.delay;
        }
        if (options.max_intervals) {
            max_intervals = options.max_intervals;
        }
    }

    var interval_count = 0;
    var interval = setInterval(function() {
        try {
            if (interval_count >= max_intervals) {
                // Exceed maximum number of tries.
                clearInterval(interval);
                callback(null, false);
            }
            else {
                var task = new StrikeFinder.Task({id: task_id});
                task.fetch({
                    success: function (model, response) {
                        if (response.state == 'SUCCESS') {
                            // The task was successful.
                            clearInterval(interval);
                            callback(null, true, response);
                        }
                        else {
                            // Increment the interval count.
                            interval_count = interval_count + 1;
                        }
                    },
                    error: function(model, response) {
                        // Error while looking up task result.
                        clearInterval(interval);
                        callback('Error while checking on task result: ' + task_id);
                    }
                });
            }
        }
        catch (e) {
            // Error
            StrikeFinder.display_error(message);
            clearInterval(interval);
            callback(e);
        }
    }, delay);
};


//
// Suppression Formatting Utilities.
//
StrikeFinder.format_suppression = function (s) {
    return _.sprintf('%s \'%s\' \'%s\' (preservecase=%s)', s.itemkey, s.condition, _.escape(s.itemvalue), s.preservecase);
};



//
// Collapsable Utilities.
//

StrikeFinder.collapse = function(el) {
    jq_el = $(el);
    if (jq_el.hasClass('collapsable-header')) {
        new StrikeFinder.CollapsableContentView({
            el: '#' + jq_el.attr('id'),
            title: jq_el.attr('collapsable-title')
        });
    }
    _.each(jq_el.find('.collapsable-header'), function(collapsable) {
        new StrikeFinder.CollapsableContentView({
            el: '#' + collapsable.id,
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
    _.each(jq_el.find('.collapsable'), function(collapsable) {
        new StrikeFinder.CollapsableContentView({
            el: '#' + collapsable.id,
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
            width: '100%',
            border: "0px solid #cccccc",
            padding: '0px',
            opacity: .8,
            backgroundColor: ''
        },
        overlayCSS: {
            backgroundColor: UAC.get_overlay_color(),
            opacity: .5
        },
        baseZ: 5000
    }
};

StrikeFinder.block = function (ev) {
    $.blockUI(StrikeFinder.get_blockui_options());
};

StrikeFinder.block_element_remove = function(el, message) {
    $(el).block(StrikeFinder.get_blockui_options('<img src="/static/img/ajax-loader.gif">'));
};

StrikeFinder.block_element = function(el, message) {
    $(el).block(StrikeFinder.get_blockui_options('<img src="/static/img/ajax-loader.gif">'));
};

StrikeFinder.unblock = function(el) {
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
 * Override the default backbone POST behavior to send the Django CSRF token.
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

$(document).ajaxError(function (collection, response, options) {

    //console.dir(collection);
    //console.dir(response);
    //console.dir(options);

    if (response) {
        if (response.status == 307) {
            // No session? TODO
            console.dir('Redirecting to login...');
            window.location = document.URL;
        }
        else {
            if (!('abort' == response.statusText)) {
                // Error
                log.warn("Exception (" + response.statusText + ") while processing request for url: " +
                    collection.url);
                log.warn(response.data);
                StrikeFinder.display_error("An error has occurred while processing your request: " + response.statusText);
            }
        }
    }
    else {
        log.warning("Error during processing, response is invalid");
    }
});
//$.ajaxSetup({
//    timeout: 180000
//});




//
// Date Formatting.
//

StrikeFinder.DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

StrikeFinder.format_date_string = function(s) {
    return s ? moment(s, 'YYYY-MM-DDTHH:mm:ss.SSS').format(StrikeFinder.DATE_FORMAT) : '';
};

StrikeFinder.format_unix_date = function(unix) {
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
