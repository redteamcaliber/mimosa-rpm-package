define (require) ->

    Marionette = require 'marionette'
    templates = require 'uac/ejs/templates'

    #
    # View class for displaying a panel of label value properties.
    #
    class PropertyView extends Marionette.ItemView
        template: templates['property.ejs']

        get_data: ->
            undefined

        get_properties: ->
            undefined

        serializeData: ->
            data:
                title: @get_title()
                properties: @get_properties()


