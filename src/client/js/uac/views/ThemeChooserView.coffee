define (require) ->
  Marionette = require 'marionette'
  templates = require 'uac/ejs/templates'
  uac_utils = require 'uac/common/utils'

  class ThemeChooserView extends Marionette.ItemView
    template: templates['themechooser.ejs']
    events:
      "click a.uac-theme": "on_theme_click"
      "click button.fontOption": "on_font_click"

    on_font_click: (ev)->
      console.log "Setting UAC theme font: #{ev.target.value} from #{UAC.font_size}"
      #enable all the buttons
      $('.fontOption').prop('disabled', false);

      #now disable the button that was clicked
      $(ev.target).prop('disabled', true)

      UAC.font_size = ev.target.value
      uac_utils.set_theme UAC.current_theme,  UAC.font_size

    on_theme_click: (ev) ->
      view = this
      attr = ev.currentTarget.attributes
      theme_attr = attr["data-uac-theme"]
      if theme_attr
        UAC.current_theme = theme_attr.value
        theme_name = _.findWhere(UAC.themes, {id: theme_attr.value}).name
        view.$el.find("#selectedThemeText").text(theme_name)
        # Update the current theme.
        console.log "Setting UAC theme: " + theme_attr.value
        uac_utils.set_theme theme_attr.value, UAC.font_size
        view.$el.find("a.uac-theme").parent().removeClass "disabled"
        view.$el.find("a.uac-theme[data-uac-theme=#{theme_attr.value}]").parent().addClass "disabled"
      else

        # Error
        console.error "Unable to located theme attribute: " + JSON.stringify(attr)
      return

  ThemeChooserView