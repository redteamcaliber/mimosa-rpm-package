define (require) ->
    Marionette = require 'marionette'
    templates = require 'uac/ejs/templates'

    class MD5ContentView extends Marionette.ItemView
        template: templates['md5-details.ejs']

        serializeData: ->
            (
                vt: @model.get('vt')
            )

    MD5ContentView