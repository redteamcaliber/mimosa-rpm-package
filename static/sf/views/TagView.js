define(function(require) {
    var async = require('async');
    var View = require('uac/views/View');
    var SetTagModel = require('sf/models/SetTagModel');

    /**
     * View for rendering a selectable list of tags values.
     */
    TagView = View.extend({
        initialize: function(options) {
            if (this.model) {
                // Re-draw the tags view whenever the model is reloaded.
                this.listenTo(this.model, 'sync', this.render);
            }
        },
        events: {
            'click .dropdown-menu > li > a': 'on_click'
        },
        render: function() {
            var view = this;

            var disabled = view.options.disabled === true;
            var tagname = view.model.get('tagname');
            var selected_value = undefined;

            // Get the drop down menu.
            var menu = view.$('.dropdown-menu');
            // Remove any child elements.
            menu.empty();

            view.collection.each(function(item) {
                var item_name = item.get('name');
                var item_title = item.get('title');

                if (tagname && tagname == item_name) {
                    // Save off the value to display.
                    selected_value = item_title;

                    if (!disabled) {
                        menu.append(_.sprintf('<li><a name="%s" title="%s">%s &#10004;</a></li>',
                            item_name, item_name, item_title));
                    }
                } else if (!disabled) {
                    menu.append(_.sprintf('<li><a name="%s" title="%s">%s</a></li>',
                        item_name, item_name, item_title));
                }
            });

            if (selected_value) {
                view.$('.selected').html(selected_value);
            }

            if (disabled) {
                // Disable the tag component.
                view.$el.find('button').prop('disabled', true);
            }
        },
        on_click: function(ev) {
            var view = this;

            view.block();

            var tagname = $(ev.currentTarget).attr('name');
            var uuid = view.model.get('uuid');

            console.log(_.sprintf('Setting tag: %s on rowitem_uuid: %s', tagname, uuid));

            var tag_model = new SetTagModel({
                rowitem_uuid: uuid,
                tagname: tagname
            });
            tag_model.save({}, {
                async: false,
                success: function() {
                    try {
                        view.trigger('create', uuid, tagname);
                        console.log(_.sprintf('Applied tag: %s to rowitem_uuid: %s', tagname, uuid));
                        view.display_success('Successfully applied tag: ' + tagname);
                    } finally {
                        view.unblock();
                    }
                },
                error: function() {
                    view.unblock();
                    view.display_error('Error while applying tag.');
                }
            });
        }
    });

    return TagView;
});