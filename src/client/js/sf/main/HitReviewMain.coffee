define (require) ->
    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    Marionette = require 'marionette'

    vent = require('uac/common/vent')
    CollapsableView = require 'uac/views/CollapsableView'

    Events = require 'sf/common/Events'
    templates = require 'sf/ejs/templates'
    ShoppingView = require 'sf/views/ShoppingView'
    HitsFacetsView = require 'sf/views/HitsFacetsView'
    HitsTableView = require 'sf/views/HitsTableView'
    HitsDetailsView = require 'sf/views/HitsDetailsView'


    #
    # Layout for displaying the main hit review template.
    #
    class HitReviewLayout extends Marionette.Layout
        template: templates['hit-review-layout.ejs'],
        regions:
            shopping_region: '.shopping-region'
            hits_facets_region: '.hits-facets-region'
            hits_table_region: '.hits-table-region'
            hits_region: '.hits-region'
            hits_details_region: '.hits-details-region'

    HitReviewApp = new Marionette.Application()

    HitReviewApp.addRegions
        content_region: '#content'

    HitReviewApp.addInitializer ->
        # Create and display the main page layout.
        @layout = new HitReviewLayout()
        @content_region.show @layout

        # Create a collapsable to wrap the shopping view.
        @shopping_collapsable = new CollapsableView()
        @layout.shopping_region.show @shopping_collapsable

        # Display the default title.
        @set_title()

        # Create a shopping view and render it.
        @shopping_view = new ShoppingView(
            standalone: false
        )
        @shopping_collapsable.show(@shopping_view)

        @listenTo vent, Events.SF_IOCNAMEHASH_SELECT, (iocname) =>
            # Update the collapsable title
            @set_title [iocname]

        @listenTo vent, Events.SF_IOCUUID_SELECT, (iocname, ioc_uuid) =>
            # Update the collapsable title
            @set_title [iocname, ioc_uuid]

        @listenTo vent, Events.SF_EXPKEY_SELECT, (iocname, iocuuid, exp_key) =>
            # Update the collapsable title
            @set_title [iocname, iocuuid, exp_key]

        @listenTo vent, Events.SF_HITS_RENDER, (params) =>
            # Handle the click of an expression key.
            console.debug('Selected expression key: ' + params.exp_key)
            @render_hits(params)

    #
    # Display the hits.
    #
    HitReviewApp.render_hits = (params) ->
        console.log(_.sprintf('Rendering hits view with params: %s', JSON.stringify(params)))

        @params = {}

        # Hits facets.
        @facets_view = new HitsFacetsView
            el: @layout.hits_facets_region.el

        # Hits.
        @hits_table_view = new HitsTableView()
        @layout.hits_table_region.show @hits_table_view

        # Initialize the hits details view.
        @hits_details_view = new HitsDetailsView
            hits_table_view: @hits_table_view
        @layout.hits_details_region.show @hits_details_view

        @listenTo @hits_details_view, Events.SF_SUPPRESS_CREATE, =>
            # Reload the facets after a suppression is created.
            @facets_view.fetch()

        @listenTo @hits_details_view, 'create:tag', (rowitem_uuid, tagname) =>
            # A new tag has been created, loop through the table nodes and manually update the tagname
            # for the relevant row.  This is a shortcut rather than re-loading the entire table.
            @hits_table_view.update_row('uuid', rowitem_uuid, 'tagname', tagname, 1)
        @listenTo @hits_details_view, 'create:acquire', (row) =>
            # An acquisition has been created, update the row's tag value.
            @hits_table_view.update_row('uuid', row.uuid, 'tagname', 'investigating', 1)
            # Refresh the comments.
            @hits_details_view.fetch()
        @listenTo @hits_details_view, 'create:masstag', =>
            # Reload the facets after a suppression is created.
            @facets_view.fetch()

        # Listen to criteria changes and reload the views.
        @listenTo @facets_view, 'refresh', (attributes) =>
            # Reload the hits.
            @hits_table_view.fetch(attributes)

        if params.exp_key
            # Use this value when available to select the corresponding IOC tab.
            @hits_details_view.default_exp_key = params.exp_key

        # Identity rollup is the default for the hits view.
        params.identity_rollup = true

        # Render the hits.
        @facets_view.fetch(params)

        # Ensure the hits region is visible.
        $(@layout.hits_region.el).fadeIn().show()


    #
    # Function for setting the collapsable title.
    #
    HitReviewApp.set_title = (items) ->
        title = '<i class="fa fa-search"></i> IOC Selection'
        if items && items.length > 0
            for item in items
                title += " &nbsp; / &nbsp; #{item}"
        @shopping_collapsable.set_title title
        if items and items.length > 0
            @shopping_collapsable.collapse()


    HitReviewApp.start()