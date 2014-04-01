define(function (require) {
    var Backbone = require('backbone');
    var Acquisition = require('sf/models/Acquisition');

    /**
     * Collection class for acquisitions.
     */
    var AcquisitionCollection = Backbone.Collection.extend({
        model: Acquisition,
        url: function () {
            if (this.identity) {
                return _.sprintf('/sf/api/acquisitions/identity/%s', this.identity);
            }
            else {
                return '/sf/api/acquisitions';
            }
        }
    });

    return AcquisitionCollection;
});