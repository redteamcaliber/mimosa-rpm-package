define(function (require) {
    var Backbone = require('backbone');
    var IOCTermsModel = require('sf/models/IOCTermsModel');

    IOCTermsCollection = Backbone.Collection.extend({
        initialize: function (models, options) {
            this.rowitem_type = options["rowitem_type"];
        },
        model: IOCTermsModel,
        url: function () {
            return "/api/iocterms/" + this.rowitem_type;
        }
    });

    return IOCTermsCollection;
});
