define (require) ->
    Marionette = require 'marionette'

    vent = require 'uac/common/vent'
    Evented = require 'uac/common/mixins/Evented'
    TableView = require 'uac/views/TableView'
    CollapsableView = require 'uac/views/CollapsableView'
    utils = require 'uac/common/utils'

    templates = require 'sf/ejs/templates'
    StrikeFinderEvents = require 'sf/common/StrikeFinderEvents'
    HitsTableView = require 'sf/views/HitsTableView'
    HitsFacetsView = require 'sf/views/HitsFacetsView'
    HitsDetailsView = require 'sf/views/HitsDetailsView'

    #
    # View for the hits screen.
    #
    class HitsView extends Marionette.Layout
        template: templates['hit-review-layout.ejs'],
        regions:
            hits_facets_region: '.hits-facets-region'
            hits_table_region: '.hits-table-region'
            hits_region: '.hits-region'
            hits_details_region: '.hits-details-region'

        # The id/instance name of the hits table view.
        hits_table_name: 'hits-table-view'

        onShow: ->
            # Hits facets.
            @facets_view = new HitsFacetsView
                el: @hits_facets_region.el

            # Listen to criteria changes and reload the views.
            @listenTo @facets_view, 'refresh', (params) =>
                if not @hits_table_view
                    # Initialize the hits details view.
                    @hits_details_view = new HitsDetailsView
                        hits_table_name: @hits_table_name

                    if params.exp_key
                        @hits_details_view.default_exp_key = params.exp_key

                    # Load the hits data the first time.
                    @collapsable = new CollapsableView()
                    @hits_table_region.show @collapsable

                    # Construct the hits table one time only.
                    @hits_table_view = new HitsTableView
                        id: @hits_table_name
                        server_params: params

                    @register_listeners()

                    @collapsable.show @hits_table_view
                    @hits_details_region.show @hits_details_view
                else
                    # Reload the hits data.
                    @hits_table_view.render
                        server_params: params

        register_listeners: ->
            # Reload the facets after a suppression is created.
            @listenTo vent, StrikeFinderEvents.SF_SUPPRESS_CREATE, =>
                @facets_view.fetch()

            # Reload the facets after a suppression is deleted.
            @listenTo vent, StrikeFinderEvents.SF_SUPPRESS_DELETE, =>
                @facets_view.fetch()

            # Manually update the tagname of the relevant row when a new tag is created.
            @listenTo vent, StrikeFinderEvents.SF_TAG_CREATE, (params) =>
                @hits_table_view.update_row('uuid', params.rowitem_uuid, 'tagname', params.tagname, 1)
                @hits_details_view.reload_comments();

            # Update the tagname of the row's view after an acquisition is created.
            @listenTo vent, StrikeFinderEvents.SF_ACQUIRE_CREATE, (row) =>
                @hits_table_view.update_row('uuid', row.uuid, 'tagname', 'investigating', 1)
                # Refresh the comments.
                @hits_details_view.reload_comments();
                @hits_details_view.reload_tasks();

            # Reload the facets after a suppression is created.
            @listenTo vent, StrikeFinderEvents.SF_MASS_TAG_CREATE, =>
                @facets_view.fetch()

            # Update the collapsable title whenever the hits table is loaded.
            @listenToTopic
                constructorName: 'TableView'
                instanceName: @hits_table_name,
                eventName: 'load'
                handler: =>
                    @collapsable.set_title "<i class='fa fa-list'></i> Hits (#{@hits_table_view.get_total_rows()})"

        fetch: (params) ->
            local_params = _.clone params
            local_params.identity_rollup = @identity_rollup

            console.log "Fetching the hits view with params: #{JSON.stringify(local_params)}"
            @facets_view.fetch local_params


    utils.mixin HitsView, Evented