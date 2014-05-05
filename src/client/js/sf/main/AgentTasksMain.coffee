define (require) ->

    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    AgentTasksView = require 'sf/views/AgentTasksView'
    new AgentTasksView()

    return