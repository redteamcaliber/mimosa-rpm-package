define(function(require) {
    var Backbone = require('backbone');
    var IOCSummaryModel = require('sf/models/IOCSummaryModel');

    IOCSummaryCollection = Backbone.Collection.extend({
        url: '/sf/api/ioc-summary',
        model: StrikeFinder.IOCSummaryModel
    });

    return IOCSummaryCollection
});