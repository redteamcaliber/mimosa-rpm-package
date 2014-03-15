define(function (require) {
    var Backbone = require('backbone');

    var ClientModel = Backbone.Model.extend({
        idAttribute: 'client_uuid'
    });

    return ClientModel;
});
