define (require) ->

    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    HitsByTagView = require 'sf/views/HitsByTagView'
    new HitsByTagView()

    return