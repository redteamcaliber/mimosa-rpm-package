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

    // Clear the old cookie.
    document.cookie = _.sprintf('theme=; expires=%s; path=/');
    var expires = moment().add('y', 1);
    // Set a cookie specifying the current theme.
    document.cookie = _.sprintf('theme=%s; expires=%s; path=/', encodeURIComponent(theme), expires.utc());

    // Clear the overlay color since the theme has been changed.
    UAC.reset_styles();
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