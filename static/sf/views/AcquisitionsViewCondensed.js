define(function (require) {
    var View = require('uac/views/View');
    var AcquisitionsTableView = require('sf/views/AcquisitionsTableView');
    var AcquisitionCollection = require('sf/models/AcquisitionCollection');
    /**
     * View to display the acquisitions list in a condensed format.
     */
    AcquisitionsViewCondensed = View.extend({
        initialize: function () {
            var view = this;

            view.acquisitions = new AcquisitionCollection();

            view.acqusitions_table = new AcquisitionsTableView({
                el: view.el,
                collection: view.acquisitions,
                condensed: true
            });
        },
        fetch: function (identity) {
            if (!identity) {
                // Error
                console.error('Condensed acquisitions view requires an identity!');
            }

            var view = this;
            view.acquisitions.identity = identity;
            view.acquisitions.fetch();
        }
    });

    return AcquisitionsViewCondensed;
});