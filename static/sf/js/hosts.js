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
            title: '<i class="icon-list"></i> Hits',
            title_class: 'uac-header'
        });

        view.options['aoColumns'] = [
            {sTitle: "uuid", mData: "uuid", bVisible: false},
            {sTitle: "Tag", mData: "tagname", bVisible: true},
            {sTitle: "IOC UUID", mData: "ioc_uuid"},
            {sTitle: "IOC Name", mData: "iocname"},
            {sTitle: "Expression String", mData: "exp_string"},
            {sTitle: "Summary", mData: "summary1", sClass: 'wrap'},
            {sTitle: "Summary2", mData: "summary2", sClass: 'wrap'},
            {sTitle: "am_cert_hash", mData: "am_cert_hash", bVisible: false}
        ];
        view.options['aaSorting'] = [];

        view.options.sDom = 'Rl<"sf-table-wrapper"t>ip';

        if (!this.collection) {
            view.collection = new StrikeFinder.HitsCollection();
        }
        view.listenTo(view.collection, 'sync', view.render);
    },
    fetch: function (am_cert_hash) {
        this.collection.am_cert_hash = am_cert_hash;
        this.collection.fetch();
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
            el: view.el,
            title: '',
            title_class: 'uac-header'
        });
    },
    render: function () {
        var view = this;

        var data = this.model.toJSON();

        // Update the collapsable title.
        var title = data.cluster.engagement.client.name + ' : ' + data.domain + ' / ' + data.hostname;
        view.collapsable.set('title', '<i class="icon-desktop"></i> ' + title);
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