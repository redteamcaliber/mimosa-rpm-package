define(function (require) {
    var TableView = require('uac/common/TableView');

    /**
     * IOC Summary table view.
     */
    var IOCSummaryTableView = TableView.extend({
        initialize: function (options) {
            var view = this;
            if (!view.collection) {
                view.collection = new StrikeFinder.IOCSummaryCollection();
                view.listenTo(view.collection, 'sync', view.render);
            }

            options.aoColumns = [
                {sTitle: "IOC Name", mData: "iocname"},
                {sTitle: "Hash", mData: "iocnamehash", bVisible: false},
                {sTitle: "Supp", mData: "suppressed"},
                {sTitle: "Total", mData: "totalexpressions", bVisible: false},
                {sTitle: "Open", mData: "open"},
                {sTitle: "In Progress", mData: "inprogress"},
                {sTitle: "Closed", mData: "closed"}
            ];

            options.aaSorting = [
                [ 0, "asc" ]
            ];

            options.sDom = 'ftiS';

            view.options.iDisplayLength = 200;
            view.options.bScrollInfinite = true;
            view.options.bScrollCollapse = true;
            view.options.sScrollY = '600px';
            view.options.iScrollLoadGap = 200;

            view.listenTo(view, 'row:created', function (row, data) {
                $(row).addClass(view._get_class(data.iocnamehash));
            });
        },
        select: function (iocnamehash) {
            log.info('Selecting iocnamehash: ' + iocnamehash);
            var row = $('.' + this._get_class(iocnamehash));
            if (row.length == 1) {
                this.select_row(row);
            }
        },
        _get_class: function (iocnamehash) {
            return 'iocnamehash-' + iocnamehash;
        }
    });

    return IOCSummaryTableView;
});