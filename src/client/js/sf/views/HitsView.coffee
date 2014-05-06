define (require) ->
    Marionette = require 'marionette'
    View = require 'uac/views/View'
    TableView = require 'uac/views/TableView'
    CollapsableContentView = require 'uac/views/CollapsableContentView'
    uac_utils = require 'uac/common/utils'

    templates = require 'sf/ejs/templates'
    HitsDetailsView = require 'sf/views/HitsDetailsView'
    HitsFacetsView = require 'sf/views/HitsFacetsView'

    #
    # Hits table view.
    #
    class HitsTableView extends TableView
        initialize: (options) ->
            super options

            @hits_collapsable = new CollapsableContentView
                el: @el

            @options.sAjaxSource = '/sf/api/hits'
            @options.sAjaxDataProp = 'results'
            @options.bServerSide = true

            @options.oLanguage =
                sEmptyTable: 'No hits were found'

            @options.aoColumns = [{
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
            }]

            @options.aaSorting = [
                [1, 'desc']
            ]

            @options.aoColumnDefs = [
                @date_formatter(1)
            ]

            @listenTo @, 'load', ->
                # Create the CSV link in the table header.

                # The url for the link.
                url = '/sf/api/hits?format=csv'
                if @params
                    url += '&' + $.param @params

                # The download file for the link.
                file = 'hits-' + moment().format('YYYY-MM-DD-HH:mm:ss') + '.csv'
                # The link.
                html = _.sprintf('<div class="pull-right" style="margin-bottom: 10px"><a download="%s" href="%s">Export to CSV</a></div>', file, url)
                # Add the link the table header.
                @$el.parent().find('.uac-tableheader').append(html)


                # Select the first row.
                @select_row(0)

            @listenTo @, 'click', (row, ev) =>
                position = @get_absolute_index(ev.currentTarget)

                if position isnt undefined
                    title = _.sprintf('<i class="fa fa-list"></i> Hits (%s of %s)', position + 1, @get_total_rows())
                else
                    title = _.sprintf('<i class="fa fa-list"></i> Hits (%s)', @get_total_rows())

                # Update the title with the count of the rows.
                @hits_collapsable.set('title', title)

            @listenTo @, 'empty', =>
                title = _.sprintf('<i class="fa fa-list"></i> Hits (%s)', '0')
                @hits_collapsable.set('title', title)

            # Add the tableheader div to the table.
            @options.sDom = '<"uac-tableheader"l>tip'
            @options.iDisplayLength = 10

    #
    # View for the hits screen.
    #
    class HitsView extends Marionette.Layout
        onShow: ->
            @params = {}

            # Hits facets.
            @facets_view = new HitsFacetsView
                el: '.hits-facets-region'

            # Hits.
            @hits_table_view = new HitsTableView()
            @hits_table_region.show @hits_table_view

            # Initialize the hits details view.
            @hits_details_view = new HitsDetailsView
                hits_table_view: @hits_table_view
            @hits_details_region.show @hits_details_view

            @listenTo @hits_details_view, 'create:tag', (rowitem_uuid, tagname) =>
                # A new tag has been created, loop through the table nodes and manually update the tagname
                # for the relevant row.  This is a shortcut rather than re-loading the entire table.
                @hits_table_view.update_row('uuid', rowitem_uuid, 'tagname', tagname, 1)
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

            # Listen to criteria changes and reload the views.
            @listenTo @facets_view, 'refresh', (attributes) =>
                # Reload the hits.
                @hits_table_view.fetch(attributes)

        fetch: (params) ->
            console.log(_.sprintf('Rendering hits view with params: %s', JSON.stringify(params)))
            if params.exp_key
                # Use this value when available to select the corresponding IOC tab.
                @hits_details_view.default_exp_key = params.exp_key

            # Identity rollup is the default for the hits view.
            params.identity_rollup = true

            # Render the hits.
            @facets_view.fetch(params)


    return HitsView