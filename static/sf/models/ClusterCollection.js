define(function(require) {
    var Backbone = require('backbone');
    var ClusterModel = require('sf/models/ClusterModel');

    /**
     * Collection of clusters.
     */
    ClustersCollection = Backbone.Collection.extend({
        model: ClusterModel,
        url: '/sf/api/clusters'
    });

    return ClustersCollection;
});