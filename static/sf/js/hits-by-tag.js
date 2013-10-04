var StrikeFinder = StrikeFinder || {};

StrikeFinder.HitsByTagTableView = StrikeFinder.TableView.extend({
    initialize: function () {
        var view = this;

        view.options['aoColumns'] = [
            {sTitle: "uuid", mData: "uuid", bVisible: false},
            {sTitle: "Updated", mData: "updated", sWidth: '10%'},
            {sTitle: "Cluster", mData: "cluster_name", sWidth: '10%'},
            {sTitle: "Host", mData: "hostname", sWidth: '10%'},
            {sTitle: "am_cert_hash", mData: "am_cert_hash", bVisible: false},
            {sTitle: "Item Type", mData: "rowitem_type", sWidth: '10%'},
            {sTitle: "Tag", mData: "tagname", bVisible: false},
            {sTitle: "Summary", mData: "summary1", sWidth: '20%'},
            {sTitle: "Summary2", mData: "summary2", sWidth: '20%'},
            {sTitle: "MD5sum", mData: "md5sum", sWidth: '10%'},
            {sTitle: "Owner", mData: "username", sWidth: '10%'}
        ];

        view.options.aoColumnDefs = [
            {
                mRender: function (data, type, row) {
                    return StrikeFinder.format_date_string(data);
                },
                aTargets: [1]
            }
        ];

        view.options.aaSorting = [];

        view.options.sDom = 'Rlf<"sf-table-wrapper"t>ip';

        if (!this.collection) {
            view.collection = new StrikeFinder.HitsCollection();
        }
        view.listenTo(view.collection, 'sync', view.render);
    },
    fetch: function (tagname) {
        var view = this;
        if (tagname) {
            view.collection.tagname = tagname;
        }
        StrikeFinder.block();
        view.collection.fetch({
            success: function() {
                StrikeFinder.unblock();
            },
            error: function() {
                StrikeFinder.unblock();
            }
        });
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
        view.tags.reset(StrikeFinder.searchable_tags);
    },
    render: function() {
        var view = this;
        log.debug('Rendering hits for tagname: ' + view.tagname);
        view.run_once('init_hits', function() {

            // TODO: Change this to a regular collapsable view so that the title can be updated.
            // Initialize the collapsables.
            StrikeFinder.collapse(view.$el);

            view.hits_table_view = new StrikeFinder.HitsByTagTableView({
                el: '#hits-table'
            });
            view.listenTo(view.hits_table_view, 'load', function () {
                view.hits_table_view.select_row(0);
            });

            // Create the hits details view.
            view.hits_details_view = new StrikeFinder.HitsDetailsView({
                el: '#hits-details-div',
                hits_table_view: view.hits_table_view,
                suppress: false,
                masstag: false
            });
            view.listenTo(view.hits_details_view, 'create:tag', function () {
                view.hits_table_view.fetch();
            });
        });
        view.fetch();
    },
    fetch: function() {
        var view = this;
        $('#hits-div-title').html('<i class="icon-tag"></i> ' + view.tagname);
        view.hits_table_view.fetch(view.tagname);
    }
});
