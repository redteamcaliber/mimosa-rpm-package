define (require)->

  DialogView = require 'uac/views/DialogView'
  sfTemplates = require 'sf/ejs/templates'
  MD5ContentView = require 'uac/views/MD5ContentView'

  MD5ModalView = DialogView.extend

      render: ->
        @apply_template sfTemplates, 'md5-modal.ejs', @model.toJSON()

        md5ContentView = new MD5ContentView
          el: '#md5-dialog-modal-body'
          data: @model.toJSON()

        md5ContentView.render()

        @modal()

  return MD5ModalView

