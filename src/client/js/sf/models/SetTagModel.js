define(function (require) {
    var Backbone = require('backbone');

    var SetTagModel = Backbone.Model.extend({
        defaults: {
            rowitem_uuid: '',
            tagname: ''
        },
        url: function () {
            return _.sprintf('/sf/api/hits/%s/settag', this.get('rowitem_uuid'));
        }
    });

    return SetTagModel;
});