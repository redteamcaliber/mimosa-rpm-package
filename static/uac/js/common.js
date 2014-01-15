var UAC = UAC || {};


/**
 * Retrieve the UAC specific CSS styles.
 */
UAC.get_styles = function() {
    if (!UAC._styles) {
        UAC._styles = {};
        var body_style = window.getComputedStyle(document.body);
        if (body_style && body_style.getPropertyValue('background-color')) {
            UAC._styles.overlay_color =  body_style.getPropertyValue('background-color')
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
UAC.reset_styles = function() {
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
UAC.set_cookie = function(options) {
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

UAC.get_cookies = function() {
    var cookie_string = document.cookie;
    if (cookie_string === '') {
        return {};
    }
    else {
        var results = {};
        _.each(cookie_string.split("; "), function(cookie) {
            var p = cookie.indexOf("=");
            var name = cookie.substring(0,p);
            var value = cookie.substring(p+1);
            value = decodeURIComponent(value);
            results[name] = value;
        });
        return results;
    }
};

UAC.storage = function(k, o) {
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
UAC.session = function(k, o) {
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

UAC.usersettings = function(options) {
    var usersettings = UAC.storage('usersettings');
    if (!usersettings) {
        usersettings = {};
    }
    if (options) {
        _.each(_.keys(options), function(key) {
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
UAC.recent = function(options) {
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

UAC.ThemeView = Backbone.View.extend({
    initialize: function () {

    },
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

$(document).ready(function () {
    (function () {
        var uac_theme_view = new UAC.ThemeView({
            el: '#uac-user-nav'
        });
    })();
});