define(function (require) {
    var Backbone = require('backbone');

    /**
     * Model to retrieve whether cluster credentials exist.
     */
    var ClusterCredentialsModel = Backbone.Model.extend({
        idAttribute: 'cluster_uuid',
        urlRoot: '/sf/api/credentials/cluster',
        defaults: {
            found: false
        }
    });

    return ClusterCredentialsModel;
});