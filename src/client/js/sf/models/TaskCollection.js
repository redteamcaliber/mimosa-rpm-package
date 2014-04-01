define(function (require) {
    var Backbone = require('backbone');
    var Task = require('sf/models/Task');

    var TaskCollection = Backbone.Collection.extend({
        url: '/sf/api/tasks',
        model: Task
    });

    return TaskCollection;
});