define(function (require) {
    var Backbone = require('backbone');
    var ClientModel = require('sf/models/ClientModel');

    var ClientCollection = Backbone.Collection.extend({
        url: '/sf/api/clients',
        model: ClientModel
    });

    return ClientCollection;
});