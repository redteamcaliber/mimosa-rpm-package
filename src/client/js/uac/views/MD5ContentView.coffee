define (require) ->

  Backbone = require 'backbone'
  View = require 'uac/views/View'
  templates = require 'uac/ejs/templates'

  class MD5ContentView extends View
    initialize: (options)->
      view = @
      view.options = options
      if view.model
        view.listenTo view.model, 'sync', view.render

    render: ->

      view = @
#      @el='#md5hashes'
      if view.model
        context =
          vt: view.model.get('vt')
      else if view.options.data
        context = view.options.data

      @apply_template templates, 'md5-details.ejs', context



    fetch: ->
      null
  MD5ContentView