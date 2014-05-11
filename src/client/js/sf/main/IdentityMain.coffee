define (require) ->
    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    Marionette = require 'marionette'
    HitsView = require 'sf/views/HitsView'


    IdentityApp = new Marionette.Application()

    IdentityApp.addRegions
        content_region: '#content'

    IdentityApp.addInitializer ->
        options = {}
        if window.StrikeFinder.rowitem_uuid
            options.rowitem_uuid = window.StrikeFinder.rowitem_uuid
        else if window.StrikeFinder.identity
            options.identity = window.StrikeFinder.identity
        else
            throw '"rowitem" or "identity" is required.'

        hits_view = new HitsView()
        @content_region.show hits_view
        hits_view.fetch(options)

    IdentityApp.start()