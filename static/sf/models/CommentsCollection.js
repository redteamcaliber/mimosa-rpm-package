define(function (require) {
    var Backbone = require('backbone');
    var CommentsModel = require('sf/models/CommentsModel');

    CommentsCollection = Backbone.Collection.extend({
        model: CommentsModel,
        initialize: function (models, options) {
            if (options && options.rowitem_uuid) {
                this.rowitem_uuid = options.rowitem_uuid;
            }
        },
        url: function () {
            return _.sprintf('/sf/api/hits/%s/comments?limit=0', this.rowitem_uuid);
        }
    });

    return CommentsCollection;
});
