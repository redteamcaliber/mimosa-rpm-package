var UAC = UAC || {};

/**
 * Attempt to compute a reasonable overlay color or use a default.
 */
UAC.get_overlay_color = function() {
    if (!document.body) {
        // If the document body is not initialized use a default value.
        return '#cccccc';
    }
    else {
        // The body is available.
        if (!StrikeFinder.OVERLAY_COLOR) {
            // Overlay color has not been computed, use the body background color.
            var style = window.getComputedStyle(document.body);
            if (style && style.getPropertyValue('background-color')) {
                StrikeFinder.OVERLAY_COLOR = style.getPropertyValue('background-color');
            }
            else {
                // Unable to compute the overlay color, use a default.
                StrikeFinder.OVERLAY_COLOR = '#cccccc';
            }
        }
        return StrikeFinder.OVERLAY_COLOR;
    }
};

/**
 * Clear out the current overlay color.  Will be calculated again on next use.
 */
UAC.reset_overlay_color = function() {
    StrikeFinder.OVERLAY_COLOR = undefined;
};

/**
 * Change the current UAC theme.
 * @param theme - the theme name.
 */
UAC.set_theme = function(theme) {
    var url;
    if (!theme || theme == 'default') {
        // Use the default.
        url = '/static/bootstrap/css/bootstrap.min.css';
    }
    else {
        // Generate the theme url.
        url = _.sprintf('/static/bootstrap/css/bootstrap.min-%s.css', theme);
    }
    // Reload the CSS.
    $('link[title="bootstrap-theme"]').attr('href', url);

    // Clear the old cookie.
    document.cookie = _.sprintf('theme=; expires=%s; path=/');
    var expires = moment().add('y', 1);
    // Set a cookie specifying the current theme.
    document.cookie = _.sprintf('theme=%s; expires=%s; path=/', encodeURIComponent(theme), expires.utc());

    // Clear the overlay color since the theme has been changed.
    UAC.reset_overlay_color();
};


//
// Common views.
//

UAC.ThemeView = Backbone.View.extend({
    initialize: function() {

    },
    events: {
        'click a.uac-theme': 'on_theme_click'
    },
    on_theme_click: function(ev) {
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