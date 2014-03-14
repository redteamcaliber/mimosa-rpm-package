define(function (require) {
    var View = require('uac/views/View');
    var utils = require('uac/common/utils');

    IdentitiesView = View.extend({
        initialize: function(options) {
            if (this.model) {
                // Re-draw the view whenever the model is reloaded.
                this.listenTo(this.model, 'sync', this.render);
            }
        },
        events: {
            'click .dropdown-menu > li > a': 'on_click'
        },
        render: function() {
            var view = this;

            // Get the drop down menu.
            var menu = view.$('.dropdown-menu');
            // Remove any child elements.
            menu.empty();

            var uuid = view.model.get('uuid');
            var identical_hits = view.model.get('identical_hits');
            var selected = undefined;

            // Debug
            console.log('Found ' + identical_hits.length + ' identical hits for row: ' + uuid);

            if (identical_hits.length == 0) {
                view.$el.find('button').prop('disabled', true);

                view.$('.selected').html(view.get_title(view.model.get('created'), null, true, false, false));
            } else if (identical_hits.length == 1) {
                view.$el.find('button').prop('disabled', true);

                var hit = identical_hits[0];
                view.$('.selected').html(view.get_title(hit.created, null, true, false, false));
            } else {
                view.$el.find('button').prop('disabled', false);

                _.each(identical_hits, function(hit, index) {
                    if (uuid == hit.uuid) {
                        // This is the item being displayed, don't put it in the list.  Update the title instead.
                        view.$('.selected').html(view.get_title(hit.created, null, index == 0, false, true));

                        menu.append(_.sprintf('<li><a name="%s">%s</a></li>',
                            hit.uuid, view.get_title(hit.created, hit.tagtitle, index == 0, true, false)));
                    } else {
                        // Item is not the one being render, add to the list of selections.
                        menu.append(_.sprintf('<li><a name="%s">%s</a></li>',
                            hit.uuid, view.get_title(hit.created, hit.tagtitle, index == 0, false, false)));
                    }
                });
            }

            return view;
        },
        /**
         * Create a common title string for the menu items.
         * @param created - the row created date.
         * @param tag - the tagname value.
         * @param is_current - if the item is the latest.
         * @param is_caret - whether to include a caret in the output.
         * @returns {string} - the title string.
         */
        get_title: function(created, tag, is_current, is_selected, is_caret) {
            var selected_string = is_selected ? '&#10004;' : '';
            var target_string = is_current ? '&#42;' : '';
            var caret_string = is_caret ? ' <span class="caret"></span>' : '';
            var tag_string = tag ? ' - ' + tag : '';
            return _.sprintf('%s %s %s %s %s', utils.format_date_string(created), tag_string, target_string, selected_string, caret_string);
        },
        on_click: function(ev) {
            var view = this;
            // Get the selected uuid.
            var selected_uuid = $(ev.currentTarget).attr('name');

            if (selected_uuid != view.model.get('uuid')) {
                // Debug
                console.log('Selected identity: ' + selected_uuid);
                // Trigger an event that the row uuid was selected.
                view.trigger('click', selected_uuid);
            }
        }
    });

    return IdentitiesView;
});
