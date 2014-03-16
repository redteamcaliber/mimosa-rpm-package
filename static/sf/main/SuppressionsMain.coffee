define (require) ->

    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    SuppressionsView = require 'sf/views/SuppressionsView'
    suppressions_view = new SuppressionsView()
    suppressions_view.render()

    return