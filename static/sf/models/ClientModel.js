define(function (require) {
    var Backbone = require('backbone');

    var ClientModel = Backbone.Model.extend({
        idAttribute: 'uuid'
    });

    return ClientModel;
});
