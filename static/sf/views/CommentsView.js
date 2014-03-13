define(function(require) {
    var View = require('uac/common/View');
    var CollapsableContentView = require('uac/views/CollapsableContentView');
    var CommentsTableView = require('uac/views/CommentsTableView');
    var CommentsModel = require('uac/models/CommentsModel');

    /**
     * View to display and create comments.
     */
    CommentsView = View.extend({
        initialize: function(options) {
            var view = this;
            if (options.rowitem_uuid) {
                view.rowitem_uuid = options.rowitem_uuid;
            }

            view.comments_collapsable = new CollapsableContentView({
                el: view.el
            });

            view.comments_table = new CommentsTableView({
                el: view.$("#comments-table")
            });

            view.listenTo(view.comments_table, 'load', function() {
                var comments_count = view.comments_table.get_total_rows();
                view.comments_collapsable.set('title', _.sprintf('<i class="fa fa-comments"></i> Comments (%s)',
                    comments_count));
                if (comments_count == 0) {
                    // Collapse the comments if there are none.
                    view.comments_collapsable.collapse();
                } else {
                    view.comments_collapsable.expand();
                }
            });
        },
        events: {
            "click button": "add_comment",
            "keyup #comment": "on_keyup"
        },
        fetch: function(rowitem_uuid) {
            this.rowitem_uuid = rowitem_uuid;
            this.comments_table.fetch(this.rowitem_uuid);
        },
        hide: function() {
            // Hide the collapsable decorator.
            this.comments_collapsable.hide();
        },
        show: function() {
            // Show the collapsable decorator.
            this.comments_collapsable.show();
        },
        add_comment: function() {
            var view = this;
            var comment = view.$("#comment").val();
            if (!comment || comment.trim() == "") {
                log.warn('No comment value found.');
                return;
            }

            log.debug("Creating comment for rowitem_uuid: " + view.rowitem_uuid);

            var new_comment = new CommentsModel({
                comment: comment,
                rowitem_uuid: view.rowitem_uuid
            });

            log.debug('Comment rowitem_uuid: ' + new_comment.get('rowitem_uuid'));

            view.block_element(view.$el);
            new_comment.save([], {
                async: false,
                success: function(model, response, options) {
                    view.unblock(view.$el);

                    $("#comment").val("");
                    view.comments_table.fetch();
                },
                error: function(model, xhr) {
                    // Error
                    view.unblock(view.$el);
                    var details = xhr && xhr.responseText ? xhr.responseText : 'Response text not defined.';
                    view.display_error('Error while creating new comment. - ' + details);
                }
            });
        },
        on_keyup: function(ev) {
            if (ev.keyCode == '13') {
                this.add_comment();
            }
        }
    });

    return CommentsView;
});