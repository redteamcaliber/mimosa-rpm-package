define (require) ->
    $ = require 'jquery'
    View = require 'uac/views/View'
    uac_utils = require 'uac/common/utils'


    ###
    View to display and change the UAC theme.
    ###
    class ThemeView extends View
        events:
            "click a.uac-theme": "on_theme_click"

        on_theme_click: (ev) ->
            view = this
            attr = ev.currentTarget.attributes
            theme_attr = attr["data-uac-theme"]
            if theme_attr

                # Update the current theme.
                console.log "Setting UAC theme: " + theme_attr.value
                uac_utils.set_theme theme_attr.value
                view.$el.find("a.uac-theme").parent().removeClass "disabled"
                view.$el.find("a.uac-theme[data-uac-theme=#{theme_attr.value}]").parent().addClass "disabled"
            else

                # Error
                console.error "Unable to located theme attribute: " + JSON.stringify(attr)
            return

    ThemeView