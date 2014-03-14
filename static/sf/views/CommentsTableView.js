define(function(require) {
    var TableView = require('uac/views/TableView');
    var utils = require('uac/common/utils');
    var CommentsCollection = require('sf/models/CommentsCollection');

    CommentsTableView = TableView.extend({
        initialize: function() {
            var view = this;
            view.options.iDisplayLength = -1;
            view.options.aoColumns = [{
                sTitle: "Created",
                mData: "created",
                sWidth: "20%",
                bSortable: true
            }, {
                sTitle: "Comment",
                mData: "comment",
                sWidth: "60%",
                bSortable: true,
                sClass: 'wrap'
            }, {
                sTitle: "User",
                mData: "user_uuid",
                sWidth: "20%",
                bSortable: true
            }];
            view.options.aaSorting = [
                [0, "desc"]
            ];
            view.options.aoColumnDefs = [{
                mRender: function(data, type, row) {
                    return utils.format_date_string(data);
                },
                aTargets: [0]
            }];
            view.options.oLanguage = {
                sEmptyTable: 'No comments have been entered'
            };

            view.listenTo(view, 'row:created', function(row, data, index) {
                view.escape_cell(row, 1);
            });

            if (!view.collection) {
                view.collection = new CommentsCollection();
            }
            view.listenTo(view.collection, 'sync', view.render);

            view.options.iDisplayLength = 10;
            view.options.sDom = 'lftip';
        },
        /**
         * Load the comments based on the row item.
         * @param rowitem_uuid - the row item.
         */
        fetch: function(rowitem_uuid) {
            var view = this;

            if (rowitem_uuid) {
                this.collection.rowitem_uuid = rowitem_uuid;
            }
            view.block_element(view.$el);
            this.collection.fetch({
                success: function() {
                    view.unblock(view.$el);
                },
                error: function() {
                    view.unblock(view.$el);
                }
            });
        }
    });

    return CommentsTableView
});