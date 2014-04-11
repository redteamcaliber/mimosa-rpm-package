define (require) ->

    Marionette = require 'marionette'

    templates = require 'uac/ejs/templates'

    #
    # Generic view for displaying time frame search criteria.
    #     times_view = new TimeSearchView
    #         selected: 'days_1    # The time item to select.
    #         from: from_date      # The from date to display.
    #         to: to_date          # The to date to display.
    #         default: 'days_1'    # The value to select if reset_selected() is called.
    #         collection: times    # Collection of time options.
    #
    # Time collection options should follow the format:
    #
    #     {id: 'hours_1', title: 'Last Hour', unit: 'hours', unit_value: 1}
    #     {id: 'hours_10', title: 'Last 10 Hours', unit: 'hours', unit_value: 10}
    #     {id: 'days_1', title: 'Last Day', unit: 'days', unit_value: 1}
    #     {id: 'days_2', title: 'Last 2 Days', unit: 'days', unit_value: 2}
    #     {id: 'days_4', title: 'Last 4 Days', unit: 'days', unit_value: 4}
    #     {id: 'weeks_1', title: 'Last Week', unit: 'weeks', unit_value: 1}
    #
    class TimeSearchView extends Marionette.ItemView
        template: templates['search-time.ejs']

        # The format for the from and to dates.
        date_format: 'YYYY-MM-DD HH:mm'

        #
        # Initialize the view.
        #
        initialize: (options) ->
            # Save the specified options for use in render.
            if options.selected
                # An item to select has been specified.
                @selected = options.selected
            if options.from
                # The from date/time to display.
                @from = options.from
            if options.to
                # THe to date/time to display.
                @to = options.to
            if options.default
                # The default time option to display on reset.
                @default = options.default

            return

        #
        # Override the model data.
        #
        serializeData: ->
            (
                times: @collection.toJSON()
            )

        #
        # Post rendering logic.
        #
        onRender: ->
            # Listen for changes to the time entry.
            @delegateEvents
                'change input:radio[name=time]': 'on_change'

            # Set the selected item.
            if @selected
                # Display the supplied values.
                @set_selected @selected
                if @selected == 'custom'
                    # Custom is selected, should have from and to date/times.
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
            console.dir selected
            if selected
                # Grab the selected radio button.
                selected_el = @$ "input:radio[name=time][value=#{selected}]"
            else
                # Select the first item.
                selected_el = @$('input:radio').get(0)
                selected_el = $(selected_el)

            # Check the selected radio button and manually fire a change event.
            selected_el.prop('checked', true)
            selected_el.trigger 'change'
            return

        #
        # Display the default time option.
        #
        reset_selected: ->
            @set_selected @default
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


    TimeSearchView