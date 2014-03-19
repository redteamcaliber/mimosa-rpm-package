define (require) ->

    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    AlertsView = require 'alerts/views/AlertsView'
    view = new AlertsView()

    return