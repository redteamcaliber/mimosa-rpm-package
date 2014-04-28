define(function(require) {
    var Backbone = require('backbone');

    /**
     * Audit Details Model.
     */
    var AuditModel = Backbone.Model.extend({
        defaults: {
            html: ""
        },
        urlRoot: '/sf/api/audit'
    });

    return AuditModel;
});