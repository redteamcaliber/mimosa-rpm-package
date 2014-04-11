define (require) ->
    async = require 'async'
    moment = require('moment')
    View = require 'uac/views/View'
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
    class TagsSearchView extends View
        initialize: (options) ->
            unless @collection
                @collection = new TagCollection()
            @listenTo @collection, 'sync', @render

            if options and options.selected
                @selected = options.selected

        render: ->
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
            context = {
                categories: categories
                category_map: category_map
            }

            @apply_template(templates, 'search-tags.ejs', context)

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
        # Fetch the tag values.
        #
        fetch: (params) ->
            if @collection
                @collection.fetch(params)
            return

    #
    # View to allow the user to select clients.
    #
    class ClientsSearchView extends View
        initialize: (options) ->
            unless @collection
                @collection = new ClientCollection()
            @listenTo(@collection, 'sync', @render)

            if options.selected
                @selected = options.selected
            return

        render: ->
            context = {
                clients: @collection.toJSON()
            }
            @apply_template(templates, 'search-clients.ejs', context)

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
        # Retrieve the clients.
        #
        fetch: (params) ->
            if @collection
                @collection.fetch(params)


    #
    # View for displaying alert types search criteria.
    #
    class TypesSearchView extends View
        initialize: (options) ->
            unless @collection
                @collection = new AlertTypeCollection()
            @listenTo @collection, 'sync', @render

            if options.selected
                @selected = options.selected
            return

        render: ->
            @apply_template templates, 'search-types.ejs', {
                types: @collection.toJSON()
            }

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

        fetch: (params) ->
            if @collection
                @collection.fetch(params)
            return

    #
    # View for displaying alerts search criteria.  This view emits "search" events when a user clicks the search button.
    # The search criteria is passed along with the event.
    #
    class AlertsSearchView extends View
        events:
            'click #search-button': 'on_search'
            'click #reset-button': 'on_reset'

        initialize: ->
            # Retrieve any previous selections.
            selected = utils.storage Events.ALERTS_SEARCH
            if selected
                console.debug "Found existing alerts search selections: #{JSON.stringify(selected)}"

            # Create the layout.
            @apply_template templates, 'search-layout.ejs'

            # Initialize the sub views.

            tags = if selected and selected.tags then selected.tags else undefined
            @tags_view = new TagsSearchView
                selected: tags
                el: @$ '#search-tags'

            clients = if selected and selected.clients then selected.clients else undefined
            @clients_view = new ClientsSearchView
                el: @$ '#search-clients'
                selected: clients

            time = if selected and selected.time then selected.time else undefined
            if time == 'custom'
                # A custom time was specified, try and get the last save from and to date/times.
                from = if selected and selected.from then selected.from else undefined
                to = if selected and selected.to then selected.to else undefined
            @times = new TimeCollection()
            @times_view = new TimeSearchView
                selected: time
                from: from
                to: to
                default: 'days_1'
                collection: @times

            types = if selected and selected.types then selected.types else undefined
            @types_view = new TypesSearchView
                el: @$ '#search-types'
                selected: types

            return

        #
        # Render the base template.
        #
        render: ->
            utils.block()
            async.parallel [
                (callback) =>
                    @tags_view.fetch
                        success: ->
                            callback()
                        error: ->
                            callback()
                (callback) =>
                    @clients_view.fetch
                        success: ->
                            callback()
                        error: ->
                            callaback()
                (callback) =>
                    @times.fetch
                        success: =>
                            # TODO: Use regions to ensure previous view is closed.
                            @$('#search-time').append(@times_view.render().el)
                            callback()
                        error: ->
                            callback()
                (callback) =>
                    @types_view.fetch
                        success: ->
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
        # Clear any listeners and remove the views elements from the DOM.
        #
        close: ->
            # Clean up the child views.
            @tags_view.remove()
            @tags_view = null

            @clients_view.remove()
            @clients_view = null

            @times_view.close()
            @times_view = null

            @types_view.remove()
            @types_view = null;

            @remove()

            @trigger 'close'
            return

        #
        # Handle a search click.
        #
        on_search: ->
            # Check whether the from and to dates are valid.
            is_from_valid = @times_view.is_from_valid()
            is_to_valid = @times_view.is_to_valid()

            # Container for the currently selected criteria.
            selected = {}
            selected.tags = @tags_view.get_selected()
            selected.clients = @clients_view.get_selected()
            selected.time = @times_view.get_selected()
            if is_from_valid
                selected.from = @times_view.get_from_date()
            if is_to_valid
                selected.to = @times_view.get_to_date()
            selected.types = @types_view.get_selected()

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
            @tags_view.reset_selected()
            @clients_view.reset_selected()
            @times_view.reset_selected()
            @types_view.reset_selected()

            # Clear any current selections.
            utils.storage Events.ALERTS_SEARCH, undefined

            # Clear the current search selections in local storage.
            @trigger 'reset'
            return

    return AlertsSearchView