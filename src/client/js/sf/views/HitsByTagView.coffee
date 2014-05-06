define (require) ->
    Marionette = require 'marionette'
    View = require('uac/views/View')
    TableView = require('uac/views/TableView')
    SelectView = require('uac/views/SelectView')
    CollapsableContentView = require('uac/views/CollapsableContentView')

    TagCollection = require('sf/models/TagCollection')

    templates = require 'sf/ejs/templates'
    HitsDetailsView = require('sf/views/HitsDetailsView')
    HitsFacetsView = require('sf/views/HitsFacetsView')
    sf_utils = require('sf/common/utils')

    class HitsByTagTableView extends TableView
        initialize: (options) ->
            super options

            options['aoColumns'] = [
                {sTitle: "uuid", mData: "uuid", bVisible: false, bSortable: false}
                {sTitle: "Updated", mData: "updated", sClass: 'nowrap', bSortable: true}
                {sTitle: "Cluster", mData: "cluster_name", bSortable: false}
                {sTitle: "Host", mData: "hostname", bSortable: false}
                {sTitle: "am_cert_hash", mData: "am_cert_hash", bVisible: false, bSortable: false}
                {sTitle: "Item Type", mData: "rowitem_type", bSortable: false, bVisible: false}
                {sTitle: "Tag", mData: "tagname", bVisible: false, bSortable: false}
                {sTitle: "Summary", mData: "summary1", sClass: 'wrap', bSortable: true}
                {sTitle: "Summary2", mData: "summary2", sClass: 'wrap', bSortable: true}
                {sTitle: "MD5", mData: "md5sum", bSortable: true, bVisible: true, sClass: 'nowrap'}
                {sTitle: "Owner", mData: "username", bSortable: false, bVisible: false}
            ]

            options.aaSorting = [
                [1, 'desc']
            ]

            options.aoColumnDefs = [
                @date_formatter(1)
            ]

            options.oLanguage =
                sEmptyTable: 'No hits were found for the specified tag'

            options.sDom = 'l<"<sf-table-wrapper"t>ip'

            options.sAjaxSource = '/sf/api/hits'
            options.sAjaxDataProp = 'results'
            options.bServerSide = true

    class HitsByTagView extends Marionette.Layout
        template: templates['hits.ejs']

        regions:
            hits_table_region: '.hits-table-region'
            hits_details_region: '.hits-details-region'

        onShow: ->
            console.log('Rendering hits for tagname: ' + @tagname)
            @facets_view.fetch
                tagname: @tagname
            ,
                ->
                    doShow()

        doShow: ->
            @tags = new TagCollection()
            @select_tag_view = new SelectView
                el: "#tag-select"
                collection: @tags
                id_field: "name"
                value_field: "name"
                width: "200px"
            @listenTo @select_tag_view, 'change', (value) =>
                @tagname = value
                @render()

            @hits_collapsable = new CollapsableContentView
                el: '#hits-table'

            @hits_table_view = new HitsByTagTableView
                el: '#hits-table'
            @listenTo @hits_table_view, 'load', =>
                @hits_table_view.select_row(0)
                @set_title(_.sprintf('%s (%s)', @tagname, @hits_table_view.get_total_rows()))

            # Create the hits details view.
            @hits_details_view = new HitsDetailsView
                el: '#hits-details-div'
                hits_table_view: @hits_table_view

            # Hits facets.
            @facets_view = new HitsFacetsView
                el: '#hits-facets-div'

            # Listen to criteria changes and reload the views.
            @listenTo @facets_view, 'refresh', (attributes) =>
                # Reload the hits.
                @hits_table_view.fetch(attributes)

            @listenTo @hits_details_view, 'create:acquire', (row) =>
                # An acquisition has been created, update the row's tag value.
                @hits_table_view.update_row('uuid', row.uuid, 'tagname', 'investigating', 1)
                # Refresh the comments.
                @hits_details_view.fetch()

            @listenTo @hits_details_view, 'create:suppression', =>
                # Reload the facets after a suppression is created.
                @facets_view.fetch()

            @listenTo @hits_details_view, 'create:masstag', =>
                # Reload the facets after a suppression is created.
                @facets_view.fetch()

            sf_utils.get_tags (err, tags) =>
                if err
                    # Error.
                    @display_error('Exception while loading the hits by tag view - ' + err)
                else
                    searchable = []
                    for item in tags
                        if item.name != 'notreviewed'
                            searchable.push(item)

                    @tags.reset(searchable)

        set_title: (title) ->
            @hits_collapsable.set('title', '<i class="fa fa-tag"></i> ' + title)


    return HitsByTagView