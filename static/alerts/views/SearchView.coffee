define (require) ->
    moment = require('moment')
    View = require 'uac/views/View'
    uac_utils = require 'uac/common/utils'

    CollapsableContentView = require('uac/views/CollapsableContentView')
    TagCollection = require 'alerts/models/TagCollection'
    ClientCollection = require 'alerts/models/ClientCollection'
    TimeCollection = require 'alerts/models/TimeCollection'
    AlertTypeCollection = require 'alerts/models/AlertTypeCollection'

    templates = require 'alerts/ejs/templates'


    #
    # View to display tags search criteria.
    #
    class TagsSearchView extends View
        initialize: (options) ->
            unless @collection
                @collection = new TagCollection()
            @listenTo(@collection, 'sync', @render)

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

            return@

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
            for el in @$ '#tag:checkbox'
                is_checked = $(el).val() in selected
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
                @set_selected @options.selected
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
    # View for displaying time frame search criteria.
    #
    class TimeSearchView extends View
        # The format for the from and to dates.
        date_format: 'YYYY-MM-DD HH:mm'

        initialize: (options) ->
            unless @collection
                @collection = new TimeCollection()
            @listenTo @collection, 'sync', @render

            # Save the specified options for use in render.
            if options.selected
                @selected = @options.selected
            if options.from
                @from = @options.from
            if options.to
                @to = @options.to
            return

        render: ->
            @undelegateEvents

            context = {
                times: @collection.toJSON()
            }
            @apply_template templates, 'search-time.ejs', context

            # Listen for changes to the time entry.
            @delegateEvents
                'change input:radio[name=time]': 'on_change'

            if @selected
                # Display the supplied values.
                @set_selected @selected
                if @selected == 'custom'
                    # Custome is selected, should have from and to date/times.
                    @set_from_date @from
                    @set_to_date @to
            else
                # Display the defaults.
                @reset_selected()
            return @

        #
        # Set the selected time option.
        #
        set_selected: (selected) ->
            # Grab the selected radio button.
            selected_el = @$ "input:radio[name=time][value=#{selected}]"
            # Check the selected radio button and manually fire a change event.
            selected_el.prop('checked', true)
            selected_el.trigger 'change'
            return

        #
        # Display the default time option.
        #
        reset_selected: ->
            @set_selected 'days_1'
            return

        #
        # Fetch the times.
        #
        fetch: (params) ->
            if @collection
                @collection.fetch(params)
            return

        #
        # Retrieve the selected time radio element.
        get_selected_element: ->
            return @$('input:radio[name=time]:checked')

        #
        # Get the selected time value.
        #
        get_selected: ->
            return @get_selected_element().val()


        #
        # Get the from date.  Returns a JS date object or undefined.
        #
        get_from_date: ->
            from = moment(@$('#time-from').val())
            return if from.isValid() then from.toDate() else undefined

        #
        # Get the to date.  Returns a JS data object or undefined.
        #
        get_to_date: ->
            to = moment(@$('#time-to').val())
            return if to.isValid() then to.toDate() else undefined

        #
        # Set the displayed from date.  Expects a JS date object.
        #
        set_from_date: (from) ->
            @$('#time-from').val moment(from).format(@date_format)

        #
        # Set the displayed to date.  Expects a JS date object.
        #
        set_to_date: (to) ->
            @$('#time-to').val moment(to).format(@date_format)

        #
        # Return whether the from date is valid.
        is_from_valid: ->
            return moment(@$('#time-from').val()).isValid()

        #
        # Return whether the to date is valid.
        #
        is_to_valid: ->
            return moment(@$('#time-to').val()).isValid()

        #
        # Handle the time change event.
        #
        on_change: () ->
            # Determine if the custom time fields should be disabled.
            disabled = not (@$('input:radio[name=time][value=custom]').prop 'checked')
            # Set the time fields based on the current selection.
            selected_el = @get_selected_element()
            if disabled
                # If custom is not selected then update the from and to dates.
                @set_from_date moment().subtract(selected_el.data('unit'), selected_el.data('unit-value')).toDate()
                @set_to_date new Date()
            # Enable the time fields.
            @$('#time-from').attr 'disabled', disabled
            @$('#time-to').attr 'disabled', disabled


    #
    # View for displaying alert types search criteria.
    #
    class TypesSearchView extends View
        initialize: (options) ->
            unless @collection
                @collection = new AlertTypeCollection()
            @listenTo @collection, 'sync', @render

            if options.selected
                @selected = @options.selected
            return

        render: ->
            context = {
                types: @collection.toJSON()
            }
            @apply_template templates, 'search-types.ejs', context

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
            @set_selected([])
            return

        fetch: (params) ->
            if @collection
                @collection.fetch(params)
            return

    #
    # View for displaying HX toggle.
    #
    class IncludeHXView extends View
        initialize: (options) ->
            if options.selected
                @selected = options.selected
            @render()
            return

        render: ->
            context = {
                selected: @selected ? true
            }
            @apply_template templates, 'search-hx.ejs', context
            return

        get_selected: ->
            return @$('#include_hx:checkbox').prop 'checked'

        set_selected: (selected) ->
            @$('#include_hx:checkbox').prop 'checked', selected
            return

        reset_selected: ->
            # Include HX by default.
            @set_selected true
            return

    #
    # View for displaying alerts search criteria.
    #
    class SearchView extends View
        el: '#alerts-search'

        events:
            'click #search-button': 'on_search'
            'click #reset-button': 'on_reset'
            'click #remove-button': 'on_remove'

        initialize: ->
            @render()

            # Add a collapsable around the search view.
            @collapsable_view = new CollapsableContentView
                el: @el
                title: '<i class="fa fa-filter"></i> Filters'

            # Retrieve any previous selections.
            selected = uac_utils.storage 'alerts:search'
            if selected
                console.debug "Found existing alerts search selections: #{JSON.stringify(selected)}"

            # Initialize the sub views.

            tags = if selected and selected.tags then selected.tags else undefined
            @tags_view = new TagsSearchView
                el: '#search-tags', selected: tags

            clients = if selected and selected.clients then selected.clients else undefined
            @clients_view = new ClientsSearchView
                el: '#search-clients', selected: clients

            time = if selected and selected.time then selected.time else undefined
            if time == 'custom'
                # A custom time was specified, try and get the last save from and to date/times.
                from = if selected and selected.from then selected.from else undefined
                to = if selected and selected.to then selected.to else undefined
            @times_view = new TimeSearchView
                el: '#search-time'
                selected: time
                from: from
                to: to

            types = if selected and selected.types then selected.types else undefined
            @types_view = new TypesSearchView
                el: '#search-types'
                selected: types

            include_hx = if selected and selected.include_hx then selected.include_hx else undefined
            @hx_view = new IncludeHXView
                el: '#search-hx'
                selected: include_hx

            return

        #
        # Render the base template.
        #
        render: ->
            @apply_template templates, 'search-template.ejs'
            return @

        #
        # Fetch all the sub view data.
        #
        fetch: ->
            @tags_view.fetch()
            @clients_view.fetch()
            @times_view.fetch()
            @types_view.fetch()
            return

        #
        # Clear any listeners and remove the views elements from the DOM.
        #
        close: ->
            # Remove the child views.
            @tags_view.remove()
            @clients_view.remove()
            @times_view.remove()
            @types_view.remove()

            # Clear any events.
            @stopListening
            # Empty the element.
            @$el.empty()

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
            selected.include_hx = @hx_view.get_selected() is true

            if not is_from_valid
                # From date is not valid.
                @display_error '"From" is not valid date value.'
            if not is_to_valid
                # To date is not valid.
                @display_error '"To" is not valid: #{selected.to}'
            if is_from_valid and is_to_valid
                # Save the current search selections to local storage.
                uac_utils.storage('alerts:search', selected)
                # Trigger the search.
                console.debug "Searching for alerts using filters: #{JSON.stringify(selected)}"
                @trigger 'search', selected
            return

        #
        # Handle a reset click.
        #
        on_reset: ->
            @tags_view.reset_selected()
            @clients_view.reset_selected()
            @times_view.reset_selected()
            @types_view.reset_selected()
            @hx_view.reset_selected()

            # Clear any current selections.
            uac_utils.storage 'alerts:search', undefined

            # Clear the current search selections in local storage.
            @trigger 'reset'
            return

        #
        # This callback is for testing only.
        #
        on_remove: ->
            @close()
            return

    return SearchView