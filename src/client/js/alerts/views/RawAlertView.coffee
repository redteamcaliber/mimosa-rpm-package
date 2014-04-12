define (require) ->
    DialogView = require 'uac/views/DialogView'

    templates = require 'alerts/ejs/templates'

    class RawAlertView extends DialogView
        template: templates['raw-alert.ejs']

        serializeData: ->
            alert: JSON.stringify @model.get('content'), null, 4


    RawAlertView