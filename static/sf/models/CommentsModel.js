define(function (require) {
    var Backbone = require('backbone');

    /**
     * Comment model.
     */
    CommentsModel = Backbone.Model.extend({
        defaults: {
            comment: "",
            created: "",
            user_uuid: "",
            rowitem_uuid: "",
            token: "",
            type: ""
        },
        url: function () {
            return _.sprintf('/sf/api/hits/%s/addcomment', this.get('rowitem_uuid'));
        }
    });

    return CommentsModel;
});