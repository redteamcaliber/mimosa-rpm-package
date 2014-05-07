#
# View to select an IOC name, expression, or UUID.
#
define (require) ->
    Marionette = require('marionette')
    utils = require('uac/common/utils')

    vent = require('uac/common/vent')
    reqres = require('uac/common/reqres')
    View = require('uac/views/View')
    TableView = require('uac/views/TableView')
    
    vent.on 'all', (event_name) ->
        console.debug("Event: " + event_name)

    templates = require('sf/ejs/templates')
    Events = require('sf/common/Events')
    ExpressionView = require 'sf/views/ExpressionView'
    IOCSummaryCollection = require('sf/models/IOCSummaryCollection')
    IOCDetailsCollection = require('sf/models/IOCDetailsCollection')
    ClusterSelectionView = require('sf/views/ClusterSelectionView')


    #
    # IOC Summary table view.
    #
    class IOCSummaryTableView extends TableView
        initialize: (options) ->
            super options

            if not @collection
                @collection = new IOCSummaryCollection()
                @listenTo(@collection, 'sync', @render)

            options.aoColumns = [
                {sTitle: "IOC Name", mData: "iocname"},
                {sTitle: "Hash", mData: "iocnamehash", bVisible: false},
                {sTitle: "Supp", mData: "suppressed"},
                {sTitle: "Total", mData: "totalexpressions", bVisible: false},
                {sTitle: "Open", mData: "open"},
                {sTitle: "In Progress", mData: "inprogress"},
                {sTitle: "Closed", mData: "closed"}
            ]

            options.aaSorting = [
                [ 0, "asc" ]
            ]

            options.sDom = 'ftiS'

            options.iDisplayLength = 200
            options.bScrollCollapse = true
            options.sScrollY = '600px'
            options.iScrollLoadGap = 200

            @listenTo @, 'row:created', (row, data) =>
                $(row).addClass(@_get_class(data.iocnamehash))

            @listenTo @, 'click', (data) =>
                # Trigger a global event when an IOC summary is selected.
                vent.trigger Events.SF_IOCSUMMARY_SELECT, data

            # If there is an iocnamehash in the user settings then select it in the summary table.
            if utils.usersettings().iocnamehash
                @listenTo @, 'load', =>
                    iocnamehash = utils.usersettings().iocnamehash
                    if iocnamehash
                        @select(iocnamehash)

            @$('table').addClass('table').addClass('table-bordered').addClass('table-condensed').addClass('table-hover')

        onShow: ->
            @adjust_column_sizing()

        select: (iocnamehash) ->
            console.log('Selecting iocnamehash: ' + iocnamehash)
            rows = @$('.' + @_get_class(iocnamehash))
            if rows.length != 1
                console.error 'Multiple rows with iocnamehash class: ' + iocnamehash
            for row in rows
                @select_row(row)


        _get_class: (iocnamehash) ->
            return 'iocnamehash-' + iocnamehash

    #
    # IOC details table view.
    #
    class IOCDetailsTableView extends TableView
        initialize: (options) ->
            super options

            options.aoColumns = [
                {sTitle: "exp_key", mData: "exp_key", bVisible: false},
                {sTitle: "Expression", mData: "exp_key", sWidth: '50%'},
                {sTitle: "Supp", mData: "suppressed", sWidth: '10%'},
                {sTitle: "Open", mData: "open", sWidth: '10%'},
                {sTitle: "In Progress", mData: "inprogress", sWidth: '10%'},
                {sTitle: "Closed", mData: "closed", sWidth: '10%'}
            ]

            options.aoColumnDefs = [
                {
                    mRender: (data, type, row) ->
                        # Display <rowitem_type> (<exp_key>)
                        return _.sprintf('%s (%s)', row.rowitem_type, data)
                    ,
                    aTargets: [1]
                }
            ]

            options.sDom = 't'
            options.iDisplayLength = -1

            @expression_views = []

            @listenTo @, 'row:created', (row, data) =>
                if data.exp_string
                    expression_view = new ExpressionView({
                        el: $(row),
                        model: new Backbone.Model(data)
                    })
                    expression_view.render()
                    @expression_views.push(expression_view)

        onClose: ->
            _.each this.expression_views, (ev) ->
                ev.close()


    #
     # IOC details view of the shopping page.
     #
    class IOCDetailsView extends View
        initialize: (options) ->
            @options = options

            @listenTo(this.collection, 'sync', this.render)

        render: ->
            # Clean up any previous view data.
            @close()

            console.log('Rendering IOC details...')

            ioc_uuids = @collection.toJSON()
            iocname = 'NA'
            iocnamehash = 'NA'
            if @collection.length > 0 and @collection.at(0).get('expressions').length > 0
                expresssions = @collection.at(0).get('expressions')
                iocname = expresssions[0].iocname
                iocnamehash = expresssions[0].iocnamehash

            # Render the template.
            @apply_template templates, 'ioc-details.ejs',
                items: ioc_uuids,
                iocname: iocname,
                iocnamehash: iocnamehash

            # Register events.
            @delegateEvents
                'click .iocnamehash': 'on_ioc_click',
                'click .ioc_uuid': 'on_uuid_click'

            for ioc_uuid, index in ioc_uuids
                table = new IOCDetailsTableView
                    aaData: ioc_uuid.expressions

                @$("#uuid-" + index + "-table").append(table.el)

                table.listenTo table, 'click', (data) =>
                    exp_key = data['exp_key']

                    # Trigger an event passing the IOC name, IOC UUID, and the IOC expression.
                    @collection.each (iocuuid_item) =>
                        for expression_item in iocuuid_item.get('expressions')
                            if expression_item.exp_key == exp_key
                                vent.trigger Events.SF_EXPKEY_SELECT, expression_item.iocname, expression_item.iocuuid, exp_key
                    # Remove the selections from any of the other details tables that may already have a previous selection.
                    _.each @table_views, (table) =>
                        selected = table.get_selected_data()
                        if selected && selected.exp_key != exp_key
                            table.select_row(undefined)

                table.fetch()

                @table_views.push(table)
            return @

        on_ioc_click: (ev) ->
            iocnamehash = $(ev.currentTarget).attr('data-iocnamehash')

            @collection.each (iocuuid_item) =>
                _.each iocuuid_item.get('expressions'), (expression_item) ->
                    if expression_item.iocnamehash == iocnamehash
                        vent.trigger Events.SF_IOCNAMEHASH_SELECT, expression_item.iocname, iocnamehash

        on_uuid_click: (ev) ->
            iocuuid = $(ev.currentTarget).attr('data-ioc_uuid')

            @collection.each (iocuuid_item) =>
                _.each iocuuid_item.get('expressions'), (expression_item) ->
                    if expression_item.iocuuid == iocuuid
                        vent.trigger Events.SF_IOCUUID_SELECT, expression_item.iocname, iocuuid

        close: ->
            if @table_views
                _.each @table_views, (table_view) ->
                    table_view.close()
            @table_views = []

    #
     # The main shopping view.
     #
    class ShoppingView extends Marionette.Layout
        template: templates['shopping-layout.ejs'],

        regions:
            cluster_selection_region: '#cluster-selection-region'
            ioc_summary_region: '#ioc-summary-region'
            ioc_summary_table_region: '#ioc-summary-table-region'
            ioc_details_region: '#ioc-details-region'

        initialize: ->

            @listenTo vent, Events.SF_IOC_SEARCH, (params) =>
                # Update the services, clients, and clusters user settings on submit.
                utils.usersettings
                    services: params.services
                    clients: params.clients
                    clusters: params.clusters
                    iocnamehash: undefined
                    ioc_uuid: undefined
                    exp_key: undefined

                # Update the IOC summary view on submit.
                @render_summaries
                    services: params.services
                    clusters: params.merged_clusters
                    startDate: params.startDate
                    endDate: params.endDate

            @listenTo vent, Events.SF_IOC_RESET, =>
                @hide_summaries()
                @hide_details()

            @listenTo vent, Events.SF_IOCSUMMARY_SELECT, (data) =>
                # Handle the click of a row on the IOC summary view.  Load the related IOC details.
                iocname = data["iocname"]
                iocnamehash = data["iocnamehash"]

                console.log("iocname: " + iocname + " with iocnamehash: " + iocnamehash + " was selected...")

                utils.usersettings({iocnamehash: iocnamehash})

                @render_details(iocnamehash)

            @listenTo vent, Events.SF_EXPKEY_SELECT, (iocname, iocuuid, exp_key) =>
                # Handle the click of an expression key.
                console.log('Selected expression key: ' + exp_key)

                params = {
                    services: @services.join(',')
                    clusters: @clusters.join()
                    exp_key: exp_key
                    begin: @startDate
                    end: @endDate
                }

                vent.trigger Events.SF_HITS_RENDER, params


            @listenTo vent, Events.SF_IOCUUID_SELECT, (iocname, ioc_uuid) =>
                # Handle the select of an IOC uuid.
                console.log('Selected ioc_uuid: ' + ioc_uuid)

                params =
                    services: @services.join(',')
                    clusters: @clusters.join(',')
                    ioc_uuid: ioc_uuid
                    begin: @startDate
                    end: @endDate

                vent.trigger Events.SF_HITS_RENDER, params

            @listenTo vent, Events.SF_IOCNAMEHASH_SELECT, (iocname, iocnamehash) =>
                # Handle the select of an IOC name hash.
                console.log('Selected iocnamehash: ' + iocnamehash)

                params =
                    services: @services.join(',')
                    clusters: @clusters.join(',')
                    iocnamehash: iocnamehash
                    begin: @startDate
                    end: @endDate

                vent.trigger vent, Events.SF_HITS_RENDER params

        #
        # Display the cluster selection view on render.
        #
        onRender: ->
            # Create the cluster selection component.
            @cluster_selection_view = new ClusterSelectionView()
            @listenTo @cluster_selection_view, 'show', ->
                services = @cluster_selection_view.get_selected_services()
                clusters = @cluster_selection_view.get_clusters()
                if services and services.length > 0 and clusters and clusters.length > 0

                    # Attempt to display the summary data based on the current user settings.
                    console.debug("invoking render summaries")
                    @render_summaries
                        services: @cluster_selection_view.get_selected_services()
                        clusters: @cluster_selection_view.get_clusters()
                        startDate: @cluster_selection_view.get_start_date()
                        endDate:  @cluster_selection_view.get_end_date()

            @cluster_selection_region.show(@cluster_selection_view)

        get_selected_ioc_summary_data: ->
            return this.ioc_summaries_view.get_selected_data()

        #
        # Hide the IOC summary view.
        #
        hide_summaries: ->
            @$(@ioc_summary_region.el).fadeOut().hide()

        #
        # Show the IOC summary view.
        #
        show_summaries: ->
            @$(@ioc_summary_region.el).fadeIn().show()

        #
        # Hide the IOC details view.
        #
        hide_details: ->
            @$(@ioc_details_region.el).fadeOut().hide()

        #
        # Show the IOC details.
        #
        show_details: ->
            $(@ioc_details_region.el).fadeIn().show()

        #
        # Retrieve and display the IOC summary data.
        #
        render_summaries: (params) ->
            if not @summaries
                # Initialize the IOC summary view.
                @summaries = new IOCSummaryCollection()
                @ioc_summaries_view = new IOCSummaryTableView
                    collection: @summaries
                @listenToOnce @summaries, 'sync', ->
                    @ioc_summary_table_region.show @ioc_summaries_view

            @services = params.services
            @clusters = params.clusters

            @startDate = params.startDate
            @endDate = params.endDate

            if @services.length > 0 && @clusters.length > 0
                # Hide the IOC details.
                @hide_details()

                # Fetch the summary data.
                utils.fetch @summaries, null,
                    data:
                        services: @services.join(',')
                        clusters: @clusters.join(',')
                        begin: @startDate
                        end: @endDate

                # Display the ioc summary.
                @show_summaries()


        #
        # Retrieve and display the IOC details data.
        # @param iocnamehash - the selected IOC name hash value.
        #
        render_details: (iocnamehash) ->
            if not @details
                # Initialize the IOC details components.
                @details = new IOCDetailsCollection()
                @ioc_details_view = new IOCDetailsView
                    collection: @details

            @details.fetch
                data:
                    services: @services.join(',')
                    clusters: @clusters.join(',')
                    iocnamehash: iocnamehash
                    begin: @startDate
                    end: @endDate
                success: =>
                    if not @ioc_details_region.currentView
                        # Show the details view.
                        @ioc_details_region.show @ioc_details_view
                    else
                        # Re-render the details view.
                        @ioc_details_view.render()

                    # Ensure the details are visible.
                    @show_details()

                error: (model, response) =>
                    utils.display_response_error('Exception while rendering details for ioc: ' + iocnamehash, response)


    return ShoppingView