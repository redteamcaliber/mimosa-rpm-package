define (require) ->

    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    Marionette = require 'marionette'

    HitsByTagView = require 'sf/views/HitsByTagView'


    HitsLayout

    HitsByTagApp = new Marionette.Application()

    HitsByTagApp.addRegions
        content_region: '#content'

    HitsByTagApp.addInitializer ->
        @content_region.show new HitsByTagView()

    HitsByTagApp.start()