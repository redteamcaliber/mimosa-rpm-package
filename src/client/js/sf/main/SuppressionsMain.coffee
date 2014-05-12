define (require) ->
    _ = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    Marionette = require 'marionette'

    utils = require 'uac/common/utils'
    vent = require 'uac/common/vent'
    Evented = require 'uac/common/mixins/Evented'
    CollapsableView = require 'uac/views/CollapsableView'
    FetchController = require 'uac/controllers/FetchController'

    StrikeFinderEvents = require 'sf/common/StrikeFinderEvents'
    templates = require 'sf/ejs/templates'
    HitsView = require 'sf/views/HitsView'
    SuppressionListItemCollection = require 'sf/models/SuppressionListItemCollection'
    SuppressionsTableView = require 'sf/views/SuppressionsTableView'


    SuppressionsApp = new Marionette.Application()

    # Mixin events support.
    utils.mixin SuppressionsApp, Evented

    SuppressionsApp.addRegions
        suppressions_region: '#suppressions-region'
        hits_region: '#hits-region'

    SuppressionsApp.addInitializer ->
        try
            @listenTo vent, 'all', (event_name) ->
                console.debug "Event: #{event_name}"

            utils.block()

            @collapsable = new CollapsableView()
            @suppressions_region.show @collapsable

            @suppressions = new SuppressionListItemCollection()
            @suppressions.reset(StrikeFinder.suppressions)

            @suppressions_table = new SuppressionsTableView
                id: 'suppression-table-view'
                collection: @suppressions

            @listenTo vent, StrikeFinderEvents.SF_SUPPRESSION_SELECT, (params) =>
                console.info "Suppression selected: #{JSON.stringify(params)}"

                if not @hits_view
                    @hits_view = new HitsView()
                    @hits_region.show @hits_view
                @hits_view.fetch suppression_id: params.suppression_id

            @listenTo vent, StrikeFinderEvents.SF_SUPPRESS_DELETE, =>
                if StrikeFinder.single_entity
                    @suppressions.reset([])
                else
                    new FetchController(
                        collection: suppressions
                        region: @suppressions_region
                    ).fetch
                        success: =>
                            @collapsable.set_title "<i class='fa fa-level-down'></i> Suppressions (#{@suppressions.length})"
                            @suppressions_table.render()

            @collapsable.show @suppressions_table
            @collapsable.set_title "<i class='fa fa-level-down'></i> Suppressions (#{@suppressions.length})"
        finally
            utils.unblock()


    SuppressionsApp.start()