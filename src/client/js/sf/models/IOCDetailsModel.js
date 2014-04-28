define(function(require) {
    var Backbone = require('backbone');

    /**
     * Model that represents an IOC details item on the shopping view.
     */
    var IOCDetailsModel = Backbone.Model.extend({
        defaults: {
            iocuid: "",
            expressions: []
        }
    });

    return IOCDetailsModel;
});