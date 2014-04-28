define (require) ->

    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())


    HostsView = require 'sf/views/HostsView'

    new HostsView()

    return

