define(function (require) {
    var Backbone = require('backbone');
    var TagModel = require('sf/models/TagModel');
    var utils = require('uac/common/utils');

    var TagCollection = Backbone.Collection.extend({
        initialize: function (models, options) {
            if (options && options.searchable) {
                this.searchable = true;
            }
        },
        model: TagModel,
        url: '/sf/api/tags',
        parse: function (response) {
            if (this.searchable) {
                var results = [];
                _.each(response, function (tag) {
                    if (tag.name != 'notreviewed') {
                        results.push(tag);
                    }
                });
                return results;
            }
            else {
                return response;
            }
        }
    });

    return TagCollection;
});
