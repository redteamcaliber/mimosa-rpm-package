define(function (require) {
    var Backbone = require('backbone');
    var Task = require('sf/models/Task');

    TaskCollection = Backbone.Collection.extend({
        url: '/sf/api/tasks',
        model: Task
    });

    return TaskCollection;
});