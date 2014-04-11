define (require) ->
    async = require 'async'
    moment = require 'moment'
    Marionette = require 'marionette'
    ContainerView = require 'uac/views/ContainerView'
    utils = require 'uac/common/utils'
    vent = require 'uac/common/vent'
    TimeSearchView = require 'uac/views/TimeSearchView'

    Events = require 'alerts/common/Events'
    TagCollection = require 'alerts/models/TagCollection'
    ClientCollection = require 'alerts/models/ClientCollection'
    TimeCollection = require 'alerts/models/TimeCollection'
    AlertTypeModel = require 'alerts/models/AlertTypeModel'
    AlertTypeCollection = require 'alerts/models/AlertTypeCollection'

    templates = require 'alerts/ejs/templates'


    #
    # View to display tags search criteria.
    #
    class TagsSearchView extends Marionette.ItemView
        template: templates['search-tags.ejs']

        initialize: (options) ->
            if options and options.selected
                @selected = options.selected
            return

        serializeData: ->
            categories = [
                {id: 'new', title: 'New'}
                {id: 'open', title: 'Open'}
                {id: 'closed', title: 'Closed'}
            ]
            category_map = {}
            for tag in @collection.toJSON()
                if not (tag.category of category_map)
                    category_map[tag.category] = []
                category_map[tag.category].push tag
            (
                categories: categories
                category_map: category_map
            )

        onRender: ->
            # Set the defaults.
            if @selected
                @set_selected @selected
            else
                @reset_selected()
            return @

        #
        # Return the selected tag id's.
        #
        get_selected: ->
            selected = []
            for selected_tag in @$('#tag:checkbox:checked')
                selected.push $(selected_tag).val()
            selected

        #
        # Set the selected tags.
        #
        set_selected: (selected) ->
            for el in @$('#tag:checkbox')
                is_checked = el.value in selected
                $(el).prop 'checked', is_checked
            return

        #
        # Reset the default tag selections.
        #
        reset_selected: ->
            @set_selected(['notreviewed', 'investigating', 'escalate', 'reportable'])


    #
    # View to allow the user to select clients.
    #
    class ClientsSearchView extends Marionette.ItemView
        template: templates['search-clients.ejs']

        initialize: (options) ->
            if options.selected
                @selected = options.selected
            return

        serializeData: ->
            clients: @collection.toJSON()

        onRender: ->
            if @selected
                @set_selected @selected
            else
                @reset_selected()
            return @

        #
        # Return an array of selected client uuid's.
        #
        get_selected: ->
            selected = @$("select").val()
            if not selected
                return []
            else if Array.isArray selected
                return selected
            else
                return [selected]

        #
        # Select the clients based on uuid, unselect all others.
        #
        set_selected: (selected) ->
            @$('select option').each ->
                jqel = $(@)
                jqel.prop 'selected', jqel.val() in selected
            return

        #
        # Reset the clients, default is none.
        #
        reset_selected: ->
            # Default is to select none which returns all customers.
            @$('option').prop 'selected', false
            return


    #
    # View for displaying alert types search criteria.
    #
    class TypesSearchView extends Marionette.ItemView
        template: templates['search-types.ejs']

        initialize: (options) ->
            if options.selected
                @selected = options.selected
            return

        serializeData: ->
            types: @collection.toJSON()

        onRender: ->
            if @selected
                @set_selected @selected
            else
                @reset_selected()
            return @

        get_selected: ->
            selected = []
            for selected_type in @$('#type:checkbox:checked')
                selected.push $(selected_type).val()
            selected

        set_selected: (selected) ->
            for el in @$('#type:checkbox')
                is_checked = $(el).val() in selected
                $(el).prop 'checked', is_checked
            return

        reset_selected: ->
            # Default selections to none in order to return all.
            @set_selected([], false)
            return

    #
    # View for displaying alerts search criteria.  This view emits "search" events when a user clicks the search button.
    # The search criteria is passed along with the event.
    #
    class AlertsSearchView extends ContainerView
        template: templates['search-layout.ejs']

        events:
            'click #search-button': 'on_search'
            'click #reset-button': 'on_reset'

        regions:
            tags_region: '.tags-region'
            clients_region: '.clients-region'
            time_region: '.time-region'
            types_region: '.types-region'

        initialize: ->
            # Retrieve any previous selections.
            selected = utils.storage Events.ALERTS_SEARCH
            if selected
                console.debug "Found existing alerts search selections: #{JSON.stringify(selected)}"

            # Initialize the sub views.
            selected_tags = if selected and selected.tags then selected.tags else undefined
            @tags = new TagCollection()
            tags_view = new TagsSearchView
                selected: selected_tags
                collection: @tags
            @addChild @tags_region, tags_view

            selected_clients = if selected and selected.clients then selected.clients else undefined
            @clients = new ClientCollection()
            clients_view = new ClientsSearchView
                selected: selected_clients
                collection: @clients
            @addChild @clients_region, clients_view

            time = if selected and selected.time then selected.time else undefined
            if time == 'custom'
                # A custom time was specified, try and get the last save from and to date/times.
                from = if selected and selected.from then selected.from else undefined
                to = if selected and selected.to then selected.to else undefined
            @times = new TimeCollection()
            times_view = new TimeSearchView
                selected: time
                from: from
                to: to
                default: 'days_1'
                collection: @times
            @addChild @time_region, times_view

            selected_types = if selected and selected.types then selected.types else undefined
            @types = new AlertTypeCollection()
            types_view = new TypesSearchView
                collection: @types
                selected: selected_types
            @addChild @types_region, types_view

            return

        #
        # Render the base template.
        #
        onShow: ->
            utils.block()
            async.parallel [
                (callback) =>
                    @tags.fetch
                        success: =>
                            @tags_region.show @findByRegion(@tags_region)
                            callback()
                        error: ->
                            callback()
                (callback) =>
                    @clients.fetch
                        success: =>
                            @clients_region.show @findByRegion(@clients_region)
                            callback()
                        error: ->
                            callaback()
                (callback) =>
                    @times.fetch
                        success: =>
                            @time_region.show @findByRegion(@time_region)
                            callback()
                        error: ->
                            callback()
                (callback) =>
                    @types.fetch
                        success: =>
                            @types_region.show @findByRegion(@types_region)
                            callback()
                        error: ->
                            callback()
            ],
                (err) =>
                    utils.unblock()
                    if err
                        utils.display_error("Error while loading alerts search view: #{err}")
            return @

        #
        # Handle a search click.
        #
        on_search: ->
            # Check whether the from and to dates are valid.
            tags_view = @findByRegion(@tags_region)
            times_view = @findByRegion(@time_region)
            clients_view = @findByRegion(@clients_region)
            types_view = @findByRegion(@types_region)

            is_from_valid = times_view.is_from_valid()
            is_to_valid = times_view.is_to_valid()

            # Container for the currently selected criteria.
            selected = {}
            selected.tags = tags_view.get_selected()
            selected.clients = clients_view.get_selected()
            selected.time = times_view.get_selected()
            if is_from_valid
                selected.from = times_view.get_from_date()
            if is_to_valid
                selected.to = times_view.get_to_date()
            selected.types = types_view.get_selected()

            if not is_from_valid
                # From date is not valid.
                @display_error '"From" is not valid date value.'
            if not is_to_valid
                # To date is not valid.
                @display_error '"To" is not valid: #{selected.to}'
            if is_from_valid and is_to_valid
                # Save the current search selections to local storage.
                utils.storage(Events.ALERTS_SEARCH, selected)
                # Trigger the search.
                console.debug "Searching for alerts using filters: #{JSON.stringify(selected)}"
                @trigger Events.ALERTS_SEARCH, selected
                vent.trigger Events.ALERTS_SEARCH, selected
            return

        #
        # Handle a reset click.
        #
        on_reset: ->
            @container.forEach (child) ->
                if child.reset_selected
                    child.reset_selected()

            # Clear any current selections.
            utils.storage Events.ALERTS_SEARCH, undefined

            # Clear the current search selections in local storage.
            @trigger 'reset'
            return

    return AlertsSearchView