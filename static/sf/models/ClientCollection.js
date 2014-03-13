define(function (require) {
    var Backbone = require('backbone');
    var ClientModel = require('sf/models/ClientModel');

    ClientCollection = Backbone.Collection.extend({
        url: '/sf/api/clients',
        model: ClientModel
    });

    return ClientCollection;
});