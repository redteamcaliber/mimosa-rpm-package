define (require) ->
    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    Marionette = require 'marionette'

    vent = require('uac/common/vent')
    CollapsableView = require 'uac/views/CollapsableView'

    StrikeFinderEvents = require 'sf/common/StrikeFinderEvents'
    templates = require 'sf/ejs/templates'
    ShoppingView = require 'sf/views/ShoppingView'
    HitsView = require 'sf/views/HitsView'


    HitReviewApp = new Marionette.Application()

    HitReviewApp.addRegions
        shopping_region: '#shopping-region'
        hits_region: '#hits-region'

    HitReviewApp.addInitializer ->
        # Create a collapsable to wrap the shopping view.
        @shopping_collapsable = new CollapsableView()
        @shopping_region.show @shopping_collapsable

        # Display the default title.
        @set_title()

        # Create a shopping view and render it.
        @shopping_view = new ShoppingView(
            standalone: false
        )
        @shopping_collapsable.show(@shopping_view)

        @listenTo vent, StrikeFinderEvents.SF_IOCNAMEHASH_SELECT, (iocname) =>
            # Update the collapsable title
            @set_title [iocname]

        @listenTo vent, StrikeFinderEvents.SF_IOCUUID_SELECT, (iocname, ioc_uuid) =>
            # Update the collapsable title
            @set_title [iocname, ioc_uuid]

        @listenTo vent, StrikeFinderEvents.SF_EXPKEY_SELECT, (iocname, iocuuid, exp_key) =>
            # Update the collapsable title
            @set_title [iocname, iocuuid, exp_key]

        @listenTo vent, StrikeFinderEvents.SF_HITS_RENDER, (params) =>
            # Handle the click of an expression key.

            if not @hits_view
                console.debug('Selected expression key: ' + params.exp_key)
                @hits_view = new HitsView()
                @hits_view.listenToOnce @hits_view, 'show', =>
                    # Ensure the hits region is visible.
                    $(@hits_region.el).fadeIn().show()
                @hits_region.show @hits_view
            params_copy = _.clone(params)
            params_copy.identity_rollup = true
            @hits_view.fetch params_copy

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