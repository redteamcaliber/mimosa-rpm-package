define(function(require) {
    var Backbone = require('backbone');

    /**
     * Base list item class.
     */
    ListItemModel = Backbone.Model.extend({
        defaults: {
            selected: false
        }
    });

    return ListItemModel;
});
