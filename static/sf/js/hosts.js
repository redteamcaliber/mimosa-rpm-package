var StrikeFinder = StrikeFinder || {};

/**
 * Hits table view for display on the host view.
 * @type {*}
 */
StrikeFinder.HostHitsTableView = StrikeFinder.TableView.extend({
    initialize: function (options) {
        var view = this;

        view.collapsable = new StrikeFinder.CollapsableContentView({
            el: view.el,
            title: '<i class="fa fa-list"></i> Hits'
        });

        view.options['aoColumns'] = [
            {sTitle: "uuid", mData: "uuid", bVisible: false, bSortable: false},
            {sTitle: "Tag", mData: "tagname", bVisible: true, sWidth: '5%', bSortable: false},
            {sTitle: "IOC UUID", mData: "ioc_uuid", bVisible: false, bSortable: false},
            {sTitle: "IOC Name", mData: "iocname", sWidth: '10%', bSortable: false},
            {sTitle: "Summary", mData: "summary1", sClass: 'wrap', sWidth: '30%', bSortable: false},
            {sTitle: "Summary2", mData: "summary2", sClass: 'wrap', sWidth: '30%', bSortable: false},
            {sTitle: "am_cert_hash", mData: "am_cert_hash", bVisible: false, bSortable: false}
        ];
        view.options['aaSorting'] = [];

        view.options.sDom = 'ltip';

        view.options.sAjaxSource = '/sf/api/hits';
        view.options.sAjaxDataProp = 'results';
        view.options.bServerSide = true;

        view.listenTo(view, 'load', function () {
            // Load the first hit on load of the view.
            view.select_row(0);
        });

        view.listenTo(view, 'click', function (row, ev) {
            var position = view.get_absolute_index(ev.currentTarget);

            var title;
            if (position !== undefined) {
                title = _.sprintf('<i class="fa fa-list"></i> Hits (%s of %s)', position + 1, view.get_total_rows());
            }
            else {
                title = _.sprintf('<i class="fa fa-list"></i> Hits (%s)', view.get_total_rows());
            }
            // Update the title with the count of the rows.
            view.collapsable.set('title', title);
        });
    }
});

/**
 * StrikeFinder view class for displaying a hosts extended details.
 * @type {*}
 */
StrikeFinder.HostView = StrikeFinder.View.extend({
    initialize: function (options) {
        var view = this;

        if (!view.model) {
            var am_cert_hash = options['am_cert_hash'];
            if (!view.model) {
                var attr = {};
                if (options && options.am_cert_hash) {
                    attr.id = options.am_cert_hash;
                }
                view.model = new StrikeFinder.AgentHostModel(attr);
            }
            view.listenTo(this.model, 'sync', this.render);
        }

        view.collapsable = new StrikeFinder.CollapsableContentView({
            el: view.el
        });
    },
    render: function () {
        var view = this;

        var data = this.model.toJSON();

        // Update the collapsable title.
        var title = _.sprintf('%s (%s) : %s / %s',
            data.cluster.engagement.client.name, data.cluster.name, data.domain, data.hostname);
        view.collapsable.set('title', '<i class="fa fa-desktop"></i> ' + title);
        // Render the template.
        view.$el.html(_.template($('#host-template').html(), data));
    },
    fetch: function (am_cert_hash) {
        if (am_cert_hash) {
            this.model.id = am_cert_hash;
        }
        this.model.fetch();
    }
});

StrikeFinder.HostsApp = StrikeFinder.View.extend({
    initialize: function(options) {
        var view = this;

        view.model = new StrikeFinder.AgentHostModel(StrikeFinder.host);

        // The hosts view.
        view.hosts_view = new StrikeFinder.HostView({
            el: '#host-div',
            model: view.model
        });
        view.hosts_view.render();

        // The hits view.
        view.hits_table_view = new StrikeFinder.HostHitsTableView({
            el: '#hits-table'
        });

        // The hits details.
        view.hits_details_view = new StrikeFinder.HitsDetailsView({
            el: '#hits-details',
            hits_table_view: view.hits_table_view
        });
        view.listenTo(view.hits_details_view, 'create:tag', function(row, tagname) {
            view.hits_table_view.update_row('uuid', row.uuid, 'tagname', tagname, 0);
            view.hits_details_view.fetch();
        });

        view.fetch(view.model.get('hash'));
    },
    fetch: function(am_cert_hash) {
        var view = this;
        view.hits_table_view.fetch({
            am_cert_hash: am_cert_hash
        });
    }
});
