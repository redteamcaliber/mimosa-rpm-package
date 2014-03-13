AC.storage = function (k, o) {
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
