define (require) ->
    Marionette = require 'marionette'

    templates = require 'alerts/ejs/templates'

    class RawAlertView extends Marionette.ItemView
        template: templates['raw-alert.ejs']

        serializeData: ->
            alert: JSON.stringify @model.get('content'), null, 4

        onShow: ->
            @$('.modal').modal
                backdrop: false
            return

    RawAlertView