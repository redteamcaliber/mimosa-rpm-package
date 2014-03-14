define(function (require) {
    var View = require('uac/views/View');
    var TableView = require('uac/views/TableView');
    var CollapsableContentView = require('uac/views/CollapsableContentView');
    /**
     * Hits table for a suppression.
     */
    HitsSuppressionTableView = TableView.extend({
        initialize: function () {
            var view = this;

            view.hits_collapsable = new CollapsableContentView({
                el: view.el
            });

            view.options.oLanguage = {
                sEmptyTable: 'The selected suppression is not matching any hits',
                sZeroRecords: 'No matching hits found'
            };

            view.options['sAjaxSource'] = '/sf/api/hits';
            view.options.sAjaxDataProp = 'results';
            view.options['bServerSide'] = true;

            view.options['aoColumns'] = [
                {sTitle: "uuid", mData: "uuid", bVisible: false, bSortable: false},
                {sTitle: "Created", mData: "created", bVisible: true, bSortable: true, sClass: 'nowrap', sWidth: '10%'},
                {sTitle: "am_cert_hash", mData: "am_cert_hash", bVisible: false, bSortable: false},
                {sTitle: "rowitem_type", mData: "rowitem_type", bVisible: false, bSortable: false},
                {sTitle: "Tag", mData: "tagname", bVisible: false, bSortable: false},
                {sTitle: "Summary", mData: "summary1", bSortable: true, sClass: 'wrap'},
                {sTitle: "Summary2", mData: "summary2", bSortable: true, sClass: 'wrap'},
                {sTitle: "MD5", mData: "md5sum", sClass: 'nowrap', bSortable: true}
            ];

            view.options.aaSorting = [[1, 'desc']];

            view.options.aoColumnDefs = [
                view.date_formatter(1)
            ];


            view.options.sDom = 'ltip';
            view.listenTo(view, 'load', function () {
                view.select_row(0);

                view.hits_collapsable.set('title', _.sprintf('<i class="fa fa-level-down"></i> Suppressed Hits (%s)',
                    view.get_total_rows()));
            });
        }
    });

    return HitsSuppressionTableView;
});