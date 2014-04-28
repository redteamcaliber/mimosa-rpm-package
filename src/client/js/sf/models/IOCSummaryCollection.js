define(function(require) {
    var Backbone = require('backbone');
    var IOCSummaryModel = require('sf/models/IOCSummaryModel');

    var IOCSummaryCollection = Backbone.Collection.extend({
        url: '/sf/api/ioc-summary',
        model: IOCSummaryModel
    });

    return IOCSummaryCollection
});