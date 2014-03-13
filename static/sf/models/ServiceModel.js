define(function(require) {
    var Backbone = require('backbone');
    var ListItemModel = require('sf/models/ListItemModel');

    /**
     * Model to represent an MCIRT service.
     */
    ServiceModel = ListItemModel.extend({
        defaults: {
            id: "",
            name: ""
        }
    });
});
