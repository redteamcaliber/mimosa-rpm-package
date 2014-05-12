define (require) ->

    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())
    Marionette = require 'marionette'

    vent = require 'uac/common/vent'

    StrikeFinderEvents = require 'sf/common/StrikeFinderEvents'
    HitsByTagView = require 'sf/views/HitsByTagView'
    HitsView = require 'sf/views/HitsView'

    HitsByTagApp = new Marionette.Application()

    HitsByTagApp.addRegions
        hits_by_tag_region: '#hits-by-tag-region'
        hits_region: '#hits-region'

    HitsByTagApp.addInitializer ->
        # Debug
        @listenTo vent, 'all', (event_name) ->
            console.debug "Event: #{event_name}"

        @listenTo vent, StrikeFinderEvents.SF_TAG_SELECT, (params) =>
            unless @hits_view
                @hits_view = new HitsView()
                @hits_region.show @hits_view
            @hits_view.fetch tagname: params.tagname

        @hits_by_tag_region.show new HitsByTagView()

    HitsByTagApp.start()