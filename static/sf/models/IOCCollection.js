define(function(require) {
    var Backbone = require('backbone');
    var IOCModel = require('sf/models/IOCModel');

    IOCCollection = Backbone.Collection.extend({
        initialize: function (models, options) {
            if (options) {
                this.rowitem_uuid = options.rowitem_uuid;
            }
        },
        url: function () {
            return _.sprintf('/sf/api/hits/%s/iocs', this.rowitem_uuid);
        },
        model: IOCModel
    });

    return IOCCollection;
});