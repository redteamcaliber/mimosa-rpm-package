define(function (require) {
    var View = require('uac/views/View');
    var utils = require('uac/common/utils');

    MergeAllView = View.extend({
        initialize: function() {
            if (this.model) {
                this.listenTo(this.model, 'sync', this.render);
            }
        },
        events: {
            'click': 'on_click'
        },
        render: function() {
            var view = this;

            var current_uuid = view.model.get('uuid');
            var identical_hits = view.model.get('identical_hits');

            if (identical_hits && identical_hits.length == 1) {
                // There is only a single identity.
                view.$el.prop('disabled', true);
                view.$el.show();
            } else {
                // There are multiple identities.
                if (current_uuid == identical_hits[0].uuid) {
                    // The current identity is the most recent, enable merge all.
                    view.$el.prop('disabled', false);
                    view.$el.show();
                } else {
                    // The current identity is not the most recent.
                    view.$el.prop('disabled', true);
                    view.$el.hide();
                }
            }
        },
        /**
         * Handle the click of the merge all button.
         * @param ev - the click event.
         */
        on_click: function(ev) {
            var view = this;
            var uuid = view.model.get('uuid');
            var merge_model = new Backbone.Model();
            merge_model.url = '/sf/api/hits/' + uuid + '/mergeall';
            merge_model.save({}, {
                success: function(model, response) {
                    try {
                        console.log(_.sprintf('Merged all identities for uuid: %s', uuid));
                        view.display_success('Successfully merged all identities.');

                        // Notify that a merge has taken place.
                        view.trigger('mergeall', uuid, response.uuid);
                    } finally {
                        view.unblock();
                    }
                },
                error: function() {
                    // Error.
                    view.unblock();
                    view.display_error('Error while performing mergeall.');
                }
            });
        }
    });

    return MergeAllView;
});
