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
        parse: function (response, options) {
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
        },
        /**
         * Override the default fetch to local in sessionStorage before making the remote call.
         * @param options - the fetch options.
         * @returns {*}
         */
        fetch: function (options) {
            var tags = utils.session('strikefinder:tags');
            if (tags) {
                this.reset(tags);
            }
            else {

            }
            //do specific pre-processing

            //Call Backbone's fetch
            return Backbone.Collection.prototype.fetch.call(this, options);
        }
    });

    return TagCollection;
});
