define(function (require) {
    var Backbone = require('backbone');
    var Identity = require('sf/models/Identity');

    var IdentitiesCollection = Backbone.Collection.extend({
        model: Identity
    });

    return IdentitiesCollection;
});