define (require) ->
  Marionette = require 'marionette'

  templates = require 'uac/ejs/templates'

  vent = require 'uac/common/vent'

  ThemeChooserView = require 'uac/views/ThemeChooserView'

  #
  # Layout for displaying the main alert template.
  #
  class PreferencesLayout extends Marionette.Layout
    template: templates['preferences-layout.ejs'],
    regions:
      themechooser_content: '#themechooser-content'


    #
    # Listen to global events and show and hide regions accordingly.
    #
    initialize: ->
      null



  #
  # Alerts application instance.
  #
  PreferencesApp = new Marionette.Application()

  #
  # The main region.
  #
  PreferencesApp.addRegions
    content_region: '#content'

  #
  # Initialize the alerts application.
  #
  PreferencesApp.addInitializer ->
    # Debug
    @.listenTo vent, 'all', (event_name) ->
      console.debug "Event: #{event_name}"

    # Create and display the main page layout.
    @layout = new PreferencesLayout()
    @content_region.show @layout

    # Create the breadcrumbs view.
    @themechooser_view = new ThemeChooserView()
    @layout.themechooser_content.show @themechooser_view




  # Export the alerts application.
  PreferencesApp