define(function (require) {
    var Backbone = require('backbone');

    TagModel = Backbone.Model.extend({
        defaults: {
            id: 0,
            name: '',
            title: '',
            description: '',
            image: ''
        }
    });

    return TagModel;
});