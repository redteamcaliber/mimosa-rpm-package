define (require) ->

    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    AcquisitionsView = require 'sf/views/AcquisitionsView'
    new AcquisitionsView()

    return