define(function (require) {
    var Backbone = require('backbone');

    Task = Backbone.Model.extend({
        urlRoot: '/sf/api/tasks',
        defaults: {
            description: '',
            ready: false,
            started: undefined,
            state: undefined,
            id: '',
            result: undefined
        }
    });

    return Task;
});