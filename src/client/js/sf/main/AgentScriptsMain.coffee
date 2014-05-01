define (require) ->

    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    AgentScriptsView = require 'sf/views/AgentScriptsView'
    new AgentScriptsView()

    return