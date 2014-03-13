define(function(require) {
    var Backbone = require('backbone');
    var ServiceModel = require('sf/models/ServiceModel');

    /**
     * Collection of services.
     */
    ServicesCollection = Backbone.Collection.extend({
        model: ServiceModel,
        url: '/sf/api/services'
    });

    return ServicesCollection;
});