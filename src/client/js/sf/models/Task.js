define(function (require) {
    var Backbone = require('backbone');

    var Task = Backbone.Model.extend({
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