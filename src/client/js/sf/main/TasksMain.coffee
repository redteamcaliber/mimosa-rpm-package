define (require) ->

    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    TaskCollection = require 'sf/models/TaskCollection'
    TasksTableView = require 'sf/views/TasksTableView'

    tasks = new TaskCollection()
    new TasksTableView
        el: '#tasks-table'
        collection: tasks
    tasks.reset(StrikeFinder.tasks)

    return