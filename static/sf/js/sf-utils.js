var StrikeFinder = StrikeFinder || {};

//
// StrikeFinder Utility Methods.
//

StrikeFinder.format_suppression = function (s) {
    return _.sprintf('%s \'%s\' \'%s\' (preservecase=%s)', s.itemkey, s.itemvalue, s.condition, s.preservecase);
};

StrikeFinder.collapse = function(el) {
    jq_el = $(el);
    if (jq_el.hasClass('collapsable-header')) {
        new StrikeFinder.CollapsableContentView({
            el: '#' + jq_el.attr('id'),
            title: jq_el.attr('collapsable-title'),
            title_class: 'uac-header'
        });
    }
    _.each(jq_el.find('.collapsable-header'), function(collapsable) {
        new StrikeFinder.CollapsableContentView({
            el: '#' + collapsable.id,
            title: $(collapsable).attr('collapsable-title'),
            title_class: 'uac-header'
        });
    });
    if (jq_el.hasClass('collapsable')) {
        new StrikeFinder.CollapsableContentView({
            el: '#' + jq_el.attr('id'),
            title: jq_el.attr('collapsable-title'),
            title_class: 'uac-sub-header',
            display_toggle: false
        });
    }
    _.each(jq_el.find('.collapsable'), function(collapsable) {
        new StrikeFinder.CollapsableContentView({
            el: '#' + collapsable.id,
            title: $(collapsable).attr('collapsable-title'),
            title_class: 'uac-sub-header',
            display_toggle: false
        });
    });
};

/**
 * Retrieve the default block ui options.
 * @param message - the message to display.
 * @returns - the default options.
 */
StrikeFinder.get_blockui_options = function (message) {
    return {
        message: message ? message : '',
        css: {
            border: "0px solid #cccccc",
            padding: '0px',
            opacity: .8,
            backgroundColor: ''
        },
        overlayCSS: {
            backgroundColor: '#ffffff',
            opacity: .8
        },
        baseZ: 5000
    }
};

StrikeFinder.block = function (ev) {
    $.blockUI(StrikeFinder.get_blockui_options());
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
// ---------- Utilities ----------
//

StrikeFinder.display_info = function (message) {
    $.bootstrapGrowl(message, {
        type: 'info',
        width: 'auto',
        delay: 10000
    });
};

StrikeFinder.display_warn = function (message) {
    $.bootstrapGrowl(message, {
        type: 'warn',
        width: 'auto',
        delay: 10000
    });
};

StrikeFinder.display_success = function (message) {
    $.bootstrapGrowl(message, {
        type: 'success',
        width: 'auto',
        delay: 10000
    });
};

StrikeFinder.display_error = function (message) {
    $.bootstrapGrowl(message, {
        type: 'error',
        width: 'auto',
        delay: 15000
    });
};


//
// Override Backbone default settings.
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
// Override jQuery defaults.
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

/**
 * Tokenize a string based on whitespace and commas.
 * @param s - the input string.
 * @return the list of search terms.
 */
function parse_search_string(s) {
    var token_list = s.split(/[\s,]+/);
    var valid_tokens = [];
    _.each(token_list, function (t) {
        if (t != '') {
            valid_tokens.push(t);
        }
    });
    return valid_tokens;
}

function format_date(s) {
    return s ? moment(s, 'YYYY-MM-DDTHH:mm:ss.SSS').format('YYYY-MM-DD HH:mm:ss') : '';
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
