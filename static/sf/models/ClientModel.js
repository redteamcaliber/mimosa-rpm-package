define(function (require) {
    var Backbone = require('backbone');

    ClientModel = Backbone.Model.extend({
        idAttribute: 'client_uuid'
    });

    return ClientModel;
});
