define(function(require) {
    var ListItemModel = require('sf/models/ListItemModel');

    /**
     * Model to represent a cluster.
     */
    ClusterModel = ListItemModel.extend({
        defaults: {
            client_uuid: "",
            client_name: "",
            cluster_uuid: "",
            cluster_name: "",
            node_band: 0
        }
    });

    return ClusterModel;
});