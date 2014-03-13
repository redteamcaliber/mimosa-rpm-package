define(function (require) {
    var Backbone = require('backbone');
    var SuppressionListItem = require('sf/models/SuppressionListItem');

    SuppressionListItemCollection = Backbone.Collection.extend({
        model: SuppressionListItem,
        initialize: function (models, options) {
            if (options) {
                this.exp_key = options['exp_key'];
            }
            else {
                this.exp_key = null;
            }
        },
        url: function () {
            if (this.exp_key) {
                return _.sprintf('/sf/api/suppressions?limit=0&exp_key=%s', this.exp_key);
            }
            else {
                return '/sf/api/suppressions?limit=0';
            }
        }
    });

    return SuppressionListItemCollection;
});