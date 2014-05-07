define (require) ->
    Marionette = require 'marionette'

    vent = require 'uac/common/vent'
    TableView = require 'uac/views/TableView'
    CollapsableContentView = require 'uac/views/CollapsableContentView'
    utils = require 'uac/common/utils'

    templates = require 'sf/ejs/templates'
    Events = require 'sf/common/Events'
    HitReviewLayout = require 'sf/views/HitReviewLayout'
    HitsTableView = require 'sf/views/HitsTableView'
    HitsFacetsView = require 'sf/views/HitsFacetsView'
    HitsDetailsView = require 'sf/views/HitsDetailsView'

    #
    # View for the hits screen.
    #
    class HitsView extends HitReviewLayout
        initialize: (options) ->
            @options = options
            if @options
                # Identity rollup is the default for the hits view.
                @options.identity_rollup = true

        onShow: ->
            console.log(_.sprintf('Rendering hits view with params: %s', JSON.stringify(@options)))

            # Hits facets.
            @facets_view = new HitsFacetsView
                el: @hits_facets_region.el

            # Listen to criteria changes and reload the views.
            @listenTo @facets_view, 'refresh', (attributes) =>
                if not @hits_table_view
                    # Construct the hits table one time only.
                    @hits_table_view = new HitsTableView
                            server_params: attributes

                    # Initialize the hits details view.
                    @hits_details_view = new HitsDetailsView
                        hits_table_view: @hits_table_view

                    if @options.exp_key
                        # Use this value when available to select the corresponding IOC tab.
                        @hits_details_view.default_exp_key = @options.exp_key

                    @listenTo vent, Events.SF_SUPPRESS_CREATE, =>
                        # Reload the facets after a suppression is created.
                        @facets_view.fetch()
                    @listenTo vent, Events.SF_SUPPRESS_DELETE, =>
                        # Reload the facets after a suppression is deleted.
                        @facets_view.fetch()
                    @listenTo vent, Events.SF_TAG_CREATE, (params) =>
                        # A new tag has been created, loop through the table nodes and manually update the tagname
                        # for the relevant row.  This is a shortcut rather than re-loading the entire table.
                        @hits_table_view.update_row('uuid', params.rowitem_uuid, 'tagname', params.tagname, 1)
                    @listenTo vent, Events.SF_ACQUIRE_CREATE, (row) =>
                        # An acquisition has been created, update the row's tag value.
                        @hits_table_view.update_row('uuid', row.uuid, 'tagname', 'investigating', 1)
                        # Refresh the comments.
                        @hits_details_view.fetch() # TODO: This isn't working.
                    @listenTo vent, Events.SF_MASS_TAG_CREATE, =>
                        # Reload the facets after a suppression is created.
                        @facets_view.fetch()

                    # Load the hits data the first time.
                    @hits_table_region.show @hits_table_view
                    @hits_details_region.show @hits_details_view
                else
                    # Reload the hits data.
                    @hits_table_view.render
                        server_params: attributes

            # Render the hits.
            @facets_view.fetch(@options)


    return HitsView