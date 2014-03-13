define(function (require) {
    var Backbone = require('backbone');

    /**
     * Model for retrieving an acquisition audit.  Expects an acquisition_uuid to be supplied in the id field.
     */
    AcquisitionAuditModel = Backbone.Model.extend({
        url: function () {
            return _.sprintf('/sf/api/acquisitions/%s/audit', this.id);
        }
    });

    return AcquisitionAuditModel;
});