define(function (require) {
    var View = require('uac/views/View');
    var utils = require('uac/common/utils');

    /**
     * View for displaying the merge button and handling the related actions.
     */
    MergeView = View.extend({
        initialize: function(options) {
            if (this.model) {
                // Re-draw the view whenever the model is reloaded.
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

            // Enable the merge option when there are more than one identical hits and the currently selected identity
            // is not the target of the merge operation.
            if (identical_hits && identical_hits.length > 1 && current_uuid != identical_hits[0].uuid) {
                view.$el.prop('disabled', false);
                view.$el.show();
            } else {
                view.$el.prop('disabled', true);
                view.$el.hide();
            }
        },
        /**
         * Handle the click of the merge button.
         * @param ev - the click event.
         */
        on_click: function(ev) {
            var view = this;
            view.block();

            // Merge the current identity into the current.
            var uuid = view.model.get('uuid');
            var merge_model = new Backbone.Model();
            merge_model.url = '/sf/api/hits/' + uuid + '/merge';
            merge_model.save({}, {
                success: function(model, response) {
                    try {
                        console.log('Merged ' + uuid + ' into ' + response.uuid);

                        view.display_success('Successfully merged identities.');

                        // Notify that a merge has taken place.
                        view.trigger('merge', uuid, response.uuid);
                    } finally {
                        view.unblock();
                    }
                },
                error: function() {
                    // Error.
                    view.unblock();
                    view.display_error('Error while performing merge.');
                }
            });
        }
    });

    return MergeView;
});