define (require)->
    DialogView = require 'uac/views/DialogView'
    templates = require 'sf/ejs/templates'
    MD5ContentView = require 'uac/views/MD5ContentView'

    class MD5ModalView extends DialogView
        template: templates['md5-modal.ejs']

        regions:
            body_region: '.modal-body'

        onRender: ->
            md5ContentView = new MD5ContentView
                model: @model
            @body_region.show md5ContentView


    return MD5ModalView

