var StrikeFinder = StrikeFinder || {};

StrikeFinder.HitsByTagTableView = StrikeFinder.TableView.extend({
    initialize: function () {
        var view = this;

        view.options['aoColumns'] = [
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

        view.options.aaSorting = [[1, 'desc']];

        view.options.aoColumnDefs = [
            view.date_formatter(1)
        ];

        view.options.oLanguage = {
            sEmptyTable: 'No hits were found for the specified tag'
        };

        view.options.sDom = 'l<"<sf-table-wrapper"t>ip';

        view.options.sAjaxSource = '/sf/api/hits';
        view.options.sAjaxDataProp = 'results';
        view.options.bServerSide = true;
    }
});

StrikeFinder.HitsByTagView = StrikeFinder.View.extend({
    initialize: function () {
        var view = this;

        // Create a tag filter drop down.
        view.tags = new StrikeFinder.TagCollection();
        view.select_tag_view = new StrikeFinder.SelectView({
            el: "#tag-select",
            collection: view.tags,
            id_field: "name",
            value_field: "name",
            width: "200px"
        });
        view.listenTo(view.select_tag_view, 'change', function(value) {
            view.tagname = value;
            view.render();
        });

        view.hits_collapsable = new StrikeFinder.CollapsableContentView({
            el: '#hits-table'
        });

        view.hits_table_view = new StrikeFinder.HitsByTagTableView({
            el: '#hits-table'
        });
        view.listenTo(view.hits_table_view, 'load', function () {
            view.hits_table_view.select_row(0);
            view.set_title(_.sprintf('%s (%s)', view.tagname, view.hits_table_view.get_total_rows()));
        });

        // Create the hits details view.
        view.hits_details_view = new StrikeFinder.HitsDetailsView({
            el: '#hits-details-div',
            hits_table_view: view.hits_table_view
        });

        // Hits facets.
        view.facets_view = new StrikeFinder.HitsFacetsView({
            el: '#hits-facets-div'
        });

        // Listen to criteria changes and reload the views.
        view.listenTo(view.facets_view, 'refresh', function(attributes) {
            // Reload the hits.
            view.hits_table_view.fetch(attributes);
        });

        view.listenTo(view.hits_details_view, 'create:suppression', function() {
            // Reload the facets after a suppression is created.
            view.facets_view.fetch();
        });

        view.listenTo(view.hits_details_view, 'create:masstag', function() {
            // Reload the facets after a suppression is created.
            view.facets_view.fetch();
        });

        // Load the searchable tags list.
        view.tags.reset(StrikeFinder.searchable_tags);
    },
    render: function() {
        var view = this;
        log.debug('Rendering hits for tagname: ' + view.tagname);

        view.facets_view.fetch({tagname: view.tagname});
    },
    set_title: function(title) {
        this.hits_collapsable.set('title', '<i class="fa fa-tag"></i> ' + title);
    }
});
