define (require) ->
    DialogView = require 'uac/views/DialogView'
    EditorView = require 'uac/views/EditorView'

    templates = require 'alerts/ejs/templates'

    class RawAlertView extends DialogView
        template: templates['raw-alert.ejs']

        regions:
            editor_region: '.editor_region'

        onDomRefresh: ->
            @editor_region.show new EditorView
                mode: 'ace/mode/json'
                read_only: true
                value: JSON.stringify @model.get('content'), null, 4
                height: '800px'
                wrap: true
                print_margin: false

    RawAlertView