define(function(require) {
    var Backbone = require('backbone');

    IOCSummaryModel = Backbone.Model.extend({
        defaults: {
            suppressed: 0,
            totalexpressions: 0,
            iocname: '',
            checkedoutexpressions: 0,
            closed: 0,
            iocnamehash: '',
            open: 0
        }
    });

    return IOCSummaryModel;
});