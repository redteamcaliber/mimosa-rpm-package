define(function(require) {
    var View = require('uac/views/View');
    var TableView = require('uac/views/TableView');
    var SelectView = require('uac/views/SelectView');
    var CollapsableContentView = require('uac/views/CollapsableContentView');

    var TagCollection = require('sf/models/TagCollection');

    var HitsDetailsView = require('sf/views/HitsDetailsView');
    var HitsFacetsView = require('sf/views/HitsFacetsView');
    var sf_utils = require('sf/common/utils');

    var HitsByTagTableView = TableView.extend({
        initialize: function (options) {
            var view = this;

            // Call the super initialize.
            view.constructor.__super__.initialize.apply(this, arguments);

            options['aoColumns'] = [
                {sTitle: "uuid", mData: "uuid", bVisible: false, bSortable: false},
                {sTitle: "Updated", mData: "updated", sClass: 'nowrap', bSortable: true},
                {sTitle: "Cluster", mData: "cluster_name", bSortable: false},
                {sTitle: "Host", mData: "hostname", bSortable: false},
                {sTitle: "am_cert_hash", mData: "am_cert_hash", bVisible: false, bSortable: false},
                {sTitle: "Item Type", mData: "rowitem_type", bSortable: false, bVisible: false},
                {sTitle: "Tag", mData: "tagname", bVisible: false, bSortable: false},
                {sTitle: "Summary", mData: "summary1", sClass: 'wrap', bSortable: true},
                {sTitle: "Summary2", mData: "summary2", sClass: 'wrap', bSortable: true},
                {sTitle: "MD5", mData: "md5sum", bSortable: true, bVisible: true, sClass: 'nowrap'},
                {sTitle: "Owner", mData: "username", bSortable: false, bVisible: false}
            ];

            options.aaSorting = [
                [1, 'desc']
            ];

            options.aoColumnDefs = [
                view.date_formatter(1)
            ];

            options.oLanguage = {
                sEmptyTable: 'No hits were found for the specified tag'
            };

            options.sDom = 'l<"<sf-table-wrapper"t>ip';

            options.sAjaxSource = '/sf/api/hits';
            options.sAjaxDataProp = 'results';
            options.bServerSide = true;
        }
    });

    var HitsByTagView = View.extend({
        initialize: function () {
            var view = this;

            view.tags = new TagCollection();
            view.select_tag_view = new SelectView({
                el: "#tag-select",
                collection: view.tags,
                id_field: "name",
                value_field: "name",
                width: "200px"
            });
            view.listenTo(view.select_tag_view, 'change', function (value) {
                view.tagname = value;
                view.render();
            });

            view.hits_collapsable = new CollapsableContentView({
                el: '#hits-table'
            });

            view.hits_table_view = new HitsByTagTableView({
                el: '#hits-table'
            });
            view.listenTo(view.hits_table_view, 'load', function () {
                view.hits_table_view.select_row(0);
                view.set_title(_.sprintf('%s (%s)', view.tagname, view.hits_table_view.get_total_rows()));
            });

            // Create the hits details view.
            view.hits_details_view = new HitsDetailsView({
                el: '#hits-details-div',
                hits_table_view: view.hits_table_view
            });

            // Hits facets.
            view.facets_view = new HitsFacetsView({
                el: '#hits-facets-div'
            });

            // Listen to criteria changes and reload the views.
            view.listenTo(view.facets_view, 'refresh', function (attributes) {
                // Reload the hits.
                view.hits_table_view.fetch(attributes);
            });

            view.listenTo(view.hits_details_view, 'create:acquire', function(row) {
                // An acquisition has been created, update the row's tag value.
                view.hits_table_view.update_row('uuid', row.uuid, 'tagname', 'investigating', 1);
                // Refresh the comments.
                view.hits_details_view.fetch();
            });

            view.listenTo(view.hits_details_view, 'create:suppression', function () {
                // Reload the facets after a suppression is created.
                view.facets_view.fetch();
            });

            view.listenTo(view.hits_details_view, 'create:masstag', function () {
                // Reload the facets after a suppression is created.
                view.facets_view.fetch();
            });

            sf_utils.get_tags(function(err, tags) {
                if (err) {
                    // Error.
                    view.display_error('Exception while loading the hits by tag view - ' + err);
                }
                else {
                    var searchable = [];
                    _.each(tags, function(item) {
                        if (item.name != 'notreviewed') {
                            searchable.push(item);
                        }
                    });

                    view.tags.reset(searchable);
                }
            });
        },
        render: function () {
            var view = this;
            console.log('Rendering hits for tagname: ' + view.tagname);

            view.facets_view.fetch({tagname: view.tagname});
        },
        set_title: function (title) {
            this.hits_collapsable.set('title', '<i class="fa fa-tag"></i> ' + title);
        }
    });

    return HitsByTagView;
});
