define(function (require) {
    var TableView = require('uac/views/TableView');
    var CollapsableContentView = require('uac/views/CollapsableContentView');

    /**
     * Hits table view.
     */
    HitsTableView = TableView.extend({
        initialize: function() {
            var view = this;

            view.hits_collapsable = new CollapsableContentView({
                el: view.el
            });

            view.options.sAjaxSource = '/sf/api/hits';
            view.options.sAjaxDataProp = 'results';
            view.options.bServerSide = true;

            view.options.oLanguage = {
                sEmptyTable: 'No hits were found'
            };

            view.options.aoColumns = [{
                sTitle: 'uuid',
                mData: 'uuid',
                bVisible: false,
                bSortable: false
            }, {
                sTitle: 'Created',
                mData: 'created',
                bVisible: true,
                bSortable: true,
                sClass: 'nowrap'
            }, {
                sTitle: 'am_cert_hash',
                mData: 'am_cert_hash',
                bVisible: false,
                bSortable: false
            }, {
                sTitle: 'rowitem_type',
                mData: 'rowitem_type',
                bVisible: false,
                bSortable: false
            }, {
                sTitle: 'Tag',
                mData: 'tagname',
                bSortable: true
            }, {
                sTitle: 'Summary',
                mData: 'summary1',
                bSortable: true,
                sClass: 'wrap'
            }, {
                sTitle: 'Summary2',
                mData: 'summary2',
                bSortable: true,
                sClass: 'wrap'
            }, {
                sTitle: "MD5",
                mData: "md5sum",
                bSortable: true,
                sClass: 'nowrap'
            }];

            view.options.aaSorting = [
                [1, 'desc']
            ];

            view.options.aoColumnDefs = [
                view.date_formatter(1)
            ];

            view.listenTo(view, 'load', function() {
                // Create the CSV link in the table header.

                // The url for the link.
                var url = '/sf/api/hits?format=csv';
                if (view.params) {
                    url += '&' + $.param(view.params);
                }
                // The download file for the link.
                var file = 'hits-' + moment().format('YYYY-MM-DD-HH:mm:ss') + '.csv';
                // The link.
                var html = _.sprintf('<div class="pull-right" style="margin-bottom: 10px"><a download="%s" href="%s">Export to CSV</a></div>', file, url);
                // Add the link the table header.
                view.$el.parent().find('.uac-tableheader').append(html);


                // Select the first row.
                view.select_row(0);
            });
            view.listenTo(view, 'click', function(row, ev) {
                var position = view.get_absolute_index(ev.currentTarget);

                var title;
                if (position !== undefined) {
                    title = _.sprintf('<i class="fa fa-list"></i> Hits (%s of %s)', position + 1, view.get_total_rows());
                } else {
                    title = _.sprintf('<i class="fa fa-list"></i> Hits (%s)', view.get_total_rows());
                }
                // Update the title with the count of the rows.
                view.hits_collapsable.set('title', title);
            });
            view.listenTo(view, 'empty', function() {
                title = _.sprintf('<i class="fa fa-list"></i> Hits (%s)', '0');
                view.hits_collapsable.set('title', title);
            });

            //view.options.sDom = 'lTtip';
            // Add the tableheader div to the table.
            view.options.sDom = '<"uac-tableheader"l>tip';
            view.options.iDisplayLength = 10;
        }
    });

    return HitsTableView;
});