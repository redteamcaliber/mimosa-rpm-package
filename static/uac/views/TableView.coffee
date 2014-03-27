#
# Backbone dataTables view base class.
#
define (require) ->
    $ = require 'jquery'
    View = require 'uac/views/View'
    utils = require 'uac/common/utils'
    datatables = require 'datatables'
    datatables_bootstrap = require 'datatables_bootstrap'

    $.extend $.fn.dataTableExt.oSort, {
        "int-html-pre": (a) ->
            x = String(a).replace(/<[\s\S]*?>/g, "")
            return parseInt x
        ,
        "int-html-asc": ( a, b ) ->
            return (if a < b then -1 else (if a > b then 1 else 0))
        ,
        "int-html-desc": ( a, b ) ->
            return (if a < b then 1 else (if a > b then -1 else 0))
    }

    #
    # Base table view class.  Extend this class and provide a configure function to setup your table.
    #
    # Example usage:
    #
    #     # Specify the settings via inheritance.
    #     class MyTable extends TableView
    #         configure: (options) ->
    #              # Add DataTables settings to the options.
    #              options.iDisplayLength = 100
    #     my_table = new MyTable()
    #     my_table.render()
    #
    # or
    #    # Pass in the datatables settings.
    #    settings = {...}
    #    my_table = new TableView({settings: settings})
    #
    class TableView extends View
        #
        # Initialize the table the defaults.
        #
        initialize: (options) ->
            unless @options
                # Make sure the instance has an options bound to it.  Prior to Backbone 1.0.x were guarenteed to have an
                # options instance where as later versions removed this
                @options = options

#            unless @options.id
#                # Ensure there is an id attribute.
#                @options.id = utils.random_string(10)

            if @$el.is 'table'
                @table_el = @$el
            else
                @table_el = $ '<table>'
                @$el.append @table_el

            if @collection
                # If a collectoin is supplied then redraw the view any time it refreshes.
                @listenTo(@collection, "sync", @render)
                @listenTo(@collection, "reset", @render)

                # Listen to draw events to account for the fact that datatables does not fire page change events.  This code
                # makes up for that shortcoming by manually determining when the user has used the previous next component to
                # page through the table.
                @listenTo @, "draw", =>
                    if @_page_prev
                        # User has iterated through the table to the previous page.
                        @trigger "page", view.get_current_page()

                        # Select the last record in the current view.
                        @select_row view.length() - 1

                        # Clear the flag.
                        @_page_prev = false
                    else if @_page_next
                        # User has iterated to through the table to the next page.
                        @trigger "page", @.get_current_page()

                        # Select the next record in the view.
                        @select_row 0

                        # Clear the flag.
                        @_page_next = false

                    if @_row_index isnt undefined

                        # During a refresh reload operation a row index to select has been specified.  Attempt to select
                        # the row that corresponds to the index.
                        @select_row view._row_index
                        @_row_index = undefined
                    else if @_value_pair

                        # During a refresh/reload operation a value to select has been specified.  Attempt to select the
                        # row that corresponds to the supplied name value pair.
                        console.debug "Attempting to reselect table row value: name=#{@_value_pair.name}, value=#{@_value_pair.value}"

                        # Attempt to select the row related to the value pair after a draw event.
                        found = false
                        for node in @get_nodes()
                            data = @get_data node
                            if @_value_pair.name and @_value_pair.value and data[@_value_pair.name] is @_value_pair.value
                                # Select the node.
                                @select_row node
                                found = true
                                break

                        # If the matching row was not found it is assumed that it was deleted, select the first
                        # row instead.
                        @select_row 0  unless found

                        # Clear the value pair.
                        @_value_pair = undefined

                return # End @listenTo @, "draw", =>


        #
        # Visually highlight the row.
        #
        highlight_row: (nRow) ->
            $(nRow).addClass("active").siblings().removeClass "active"
            return

        #
        # Initiate a click event on a row.
        # @param index_or_node - the row index or row node.
        # @returns the row node or undefined.
        #
        select_row: (index_or_node) ->
            if typeof index_or_node is "number"
                length = @length()
                if @length() <= 0
                    undefined
                else if index_or_node + 1 > length
                    undefined
                else
                    pos = @get_selected_position()
                    unless pos is index_or_node

                        # Only select if we are not already on the row.
                        node = @get_nodes(index_or_node)
                        $(node).click()  if node
                        node
                    else
                        undefined
            else if index_or_node
                $(index_or_node).click()
                index_or_node
            else if index_or_node is null or index_or_node is undefined

                # Unselect all rows.
                @$("tr.active").removeClass "active"
            else
                undefined
            return

        #
        # Retrieve the selected table row.
        #
        get_selected: ->
            @$ "tr.active"

        #
        # Return the position of the selected item.
        #
        get_selected_position: ->
            selected = @get_selected()
            if selected isnt undefined and selected.length is 1
                @get_position selected.get(0)
            else
                -1

        #
        # Return the data for the selected row.
        #
        get_selected_data: ->
            selected = @get_selected()
            if selected isnt undefined and selected.length is 1
                pos = @get_position(selected.get(0))
                @get_data pos
            else
                undefined

        #
        # Return the current page number.
        #
        get_current_page: ->
            settings = @get_settings()
            Math.ceil(settings._iDisplayStart / settings._iDisplayLength) + 1

        #
        # Retrieve the row count.
        #
        get_total_rows: ->
            if @get_settings().oInit.bServerSide
                @get_settings()._iRecordsTotal
            else
                @get_nodes().length

        #
        # Retrieve the page count.
        #
        get_total_pages: ->
            settings = @get_settings()
            Math.ceil @get_total_rows() / settings._iDisplayLength

        #
        # Return whether there is a previous record to navigate to.
        #
        is_prev: ->
            pos = @get_selected_position()
            pos > 0

        #
        # Return whether there is a next record to navigate to.
        #
        is_next: ->
            pos = @get_selected_position()
            pos + 1 < @length()

        #
        # Return the previous rows data or undefined.
        #
        peek_prev_data: ->
            selected = @get_selected()
            if selected isnt undefined and selected.length is 1
                pos = @get_position(selected.get(0))
                return @get_data(pos - 1)

            # No previous.
            undefined

        #
        # Return the next rows data or undefined.
        #
        peek_next_data: ->
            if @is_next()
                selected = @get_selected()
                if selected isnt undefined and selected.length is 1
                    pos = @get_position(selected.get(0))
                    return @get_data(pos + 1)

            # No next.
            undefined

        #
        # Navigate to the previous row.
        #
        prev: ->
            selected = @get_selected()
            if selected isnt undefined and selected.length is 1
                pos = @get_position(selected.get(0))
                @select_row pos - 1
            return

        #
        # Navigate to the next row.
        #
        next: ->
            if @is_next()
                selected = @get_selected()
                if selected isnt undefined and selected.length is 1
                    pos = @get_position(selected.get(0))
                    @select_row pos + 1
            return

        #
        # Return whether there is a previous page to navigate to.
        #
        is_prev_page: ->
            @get_current_page() isnt 1

        #
        # Return whether there is a next page to navigate to.
        #
        is_next_page: ->
            @get_current_page() < @get_total_pages()

        #
        # Navigate to the previous page.
        #
        prev_page: ->
            if @is_prev_page()
                # set page takes an index.
                @set_page(@get_current_page())
            return

        #
        # Navigate to the next page.
        #
        next_page: ->
            if @is_next_page()
                # set page takes an index.
                @set_page(@get_current_page())
            return

        #
        # Set the current page of the table.
        # @param page_index - the zero based page index.
        #
        set_page: (page_index) ->
            current_page = @get_current_page()
            if page_index + 1 > current_page
                @_page_next = true
            else
                @_page_prev = true
            @table_el.fnPageChange page_index

        #
        # Return the lenth of the data.
        #
        length: ->
            @table_el.fnGetData().length

        #
        # Retrieve the original HTML DOM table element.
        #
        get_dom_table: ->
            @$el.get 0

        #
        # Return the dataTable.
        #
        get_table: ->
            @table_el

        #
        # Retrieve the table nodes or the node corresponding to index.
        #
        get_nodes: (index) ->
            @$el.fnGetNodes index

        #
        # Update a row and column with the specified data.
        #
        update: (data, tr_or_index, col_index, redraw, predraw) ->
            @table_el.fnUpdate data, tr_or_index, col_index, redraw, predraw

        #
        # Draw the dataTable.
        #
        draw: (re) ->
            @table_el.fnDraw re
            return

        #
        # Retrieve the table data.
        #
        get_data: (index_or_node, index) ->
            @table_el.fnGetData index_or_node, index

        #
        # Return the posotion of the node.
        #
        get_position: (node) ->
            @$el.fnGetPosition node

        #
        # Retrieve the index of the node relative to the entire result set.
        #
        get_absolute_index: (node) ->
            if @get_settings().oInit.bServerSide
                (@get_current_page() - 1) * @get_settings()._iDisplayLength + @get_position(node)
            else
                @get_position node

        #
        # Retrieve the dataTable settings.
        #
        get_settings: ->
            @$el.fnSettings()

        #
        # Retrieve the current search term.
        #
        get_search: ->
            result = ""
            settings = @get_settings()
            result = settings.oPreviousSearch.sSearch  if settings.oPreviousSearch and settings.oPreviousSearch.sSearch
            result

        #
        # Retrieve whether the current element contains an initialized dataTable.
        #
        is_datatable: ->
            $.fn.DataTable.fnIsDataTable @get_dom_table()

        #
        # Retrieve whether server side processing is currently enabled.
        #
        is_server_side: ->
            @get_settings().oInit.bServerSide

        #
        # Reload the table.
        #
        reload: (row_index) ->
            @clear_cache()
            @_row_index = row_index  if row_index isnt undefined
            @$el.fnDraw false
            return

        #
        # Refresh the table.
        #
        refresh: (value_pair) ->
            @clear_cache()
            @_value_pair = value_pair  if value_pair
            @$el.fnDraw false
            return

        #
        # Destroy the DataTable and empty the table element..
        #
        destroy: ->

            # Remove any listeners.
            @undelegateEvents()

            if $.fn.DataTable.fnIsDataTable(@table_el.get(0))
                console.debug "Destroying DataTable with id: #{@table_el.attr 'id'}'"

                # Destroy the old table.
                @table_el.fnDestroy false
                @table_el.empty()

                @trigger "destroy", @table_el
            else
                console.debug "Element with id: #{@table_el.attr 'id' } is not of type DataTable, skipping..."

            return


        #
        # Render the table.  If you are obtaining data from a collection then don't invoke this method, call fetch()
        # instead.  If obtaining data via server side ajax then this method can be called with server side parameters.
        #
        # @param params - the server side ajax parameters.  A map keyed by the name server_params.
        #
        #     table.render({server_params: {suppression_id: suppression_id}});
        #
        render: (params) ->
            #console.trace()

            view = @
            unless view.el
                # Error
                alert "Error: Undefined \"el\" in TableView"
                return

            # Clear the cache before re-destroying the table.
            view.clear_cache()

            # Destroy the existing table if there is one.
            view.destroy()

            # Keep track of the expanded rows.
            view._expanded_rows = []

            # Construct the table settings based on the supplied settings.
            settings = get_datatables_settings(view, view.options)

            # Apply any parameters passed to the settings.
            if params
                if params.server_params isnt null
                    server_params = params.server_params
                    if server_params
                        console.debug "Setting server params..."
                        settings.fnServerParams = (aoData) ->
                            _.each Object.keys(server_params), (key) ->
                                console.debug "Setting param #{key} and value #{server_params[key]}"
                                aoData.push
                                    name: key
                                    value: server_params[key]

                                return

                            return
                else settings.aaData = params.aaData  if params.aaData isnt null

            # If a collection is defined then use the data from the collection.
            settings.aaData = view.collection.toJSON()  if view.collection

            # Create the table.
            @table_el.dataTable(settings)

            view.delegateEvents "click tr i.expand": "on_expand"

            # Assign the bootstrap class to the length select.
            if @$el.is 'table'
                length_selects = $(".dataTables_wrapper select")
            else
                length_selects = @$ '.dataTables_wrapper select'
            for length_select in length_selects
                unless $(length_select).hasClass("form-control")
                    $(length_select).addClass "form-control"
                    $(length_select).css "min-width", "85px"

            view

        on_expand: (ev) ->
            ev.stopPropagation()
            tr = $(ev.currentTarget).closest("tr")
            @trigger "expand", tr.get(0)
            false

        #
        # Fetch the collection or retrieve the server side table data.
        #
        fetch: (params) ->
            view = this
            if params
                view.params = params
            else
                view.params = undefined

            if view.collection
                if params
                    # User has supplied options to the fetch call.
                    if not params.success and not params.error
                        # Has not overidden the success and error callbacks, block for them.
                        params.success = ->
                            view.unblock view.$el
                            return

                        params.error = ->
                            view.unblock view.$el
                            return

                        view.block view.$el
                        view.collection.fetch params
                    else
                        # Don't do any blocking.
                        view.collection.fetch params
                else

                    # Block the UI before the fetch.
                    view.block view.$el
                    view.collection.fetch
                        success: ->
                            # Unblock the ui.
                            view.unblock view.$el
                            return
                        error: ->
                            # Unblock the ui.
                            view.unblock view.$el
                            return
            else
                view.render server_params: params

            return

        #
        # Clean up and remove the table.
        #
        close: ->
            @destroy()
            @remove()

            # Fire an event after cleaning up.
            @trigger "close"
            return

        #
        # Update a client row instance.
        #
        update_row: (row_search_key, row_search_value, row_update_key, row_update_value, row_column_index) ->
            view = this
            nodes = view.get_nodes()
            i = 0

            for node, i in nodes
                data = view.get_data(i)
                if row_search_value is data[row_search_key]

                    # Found the relevant row.
                    data[row_update_key] = row_update_value
                    cols = $(node).children("td")

                    # Update the tagname cell.
                    $(cols[row_column_index]).html row_update_value
                    break # **EXIT**
                i++
            return


        #
        # Escape a cells contents.
        #
        escape_cell: (row, index) ->
            col = @get_settings().aoColumns[index]
            td = $("td:eq(#{index})", row)
            td.html _.escape(td.html())  if td
            return


        set_key: (aoData, sKey, mValue) ->
            i = 0
            iLen = aoData.length

            while i < iLen
                aoData[i].value = mValue  if aoData[i].name is sKey
                i++
            return

        get_key: (aoData, sKey) ->
            i = 0
            iLen = aoData.length

            while i < iLen
                return aoData[i].value  if aoData[i].name is sKey
                i++
            null

        #
        # Clear the pipeline cache.
        #
        clear_cache: ->
            if @cache
                @cache = undefined
            return

        #
        # DataTables pipelining support.
        #
        pipeline: (sSource, aoData, fnCallback) ->
            view = this
            ajax_data_prop = view.get_settings().sAjaxDataProp


            if not view.cache
                # Initialize the cache the first time.
                view.cache = {
                    iCacheLower: -1
                }

            # Adjust the pipe size
            bNeedServer = false
            sEcho = view.get_key(aoData, "sEcho")
            iRequestStart = view.get_key(aoData, "iDisplayStart")
            iRequestLength = view.get_key(aoData, "iDisplayLength")
            iRequestEnd = iRequestStart + iRequestLength
            view.cache.iDisplayStart = iRequestStart

            # outside pipeline?
            if view.cache.iCacheLower < 0 or iRequestStart < view.cache.iCacheLower or iRequestEnd > view.cache.iCacheUpper
                bNeedServer = true
            else unless aoData.length is view.cache.lastRequest.length

                # The number of parameters is different between the current request and the last request, assume that
                # going back to the server is necessary.
                bNeedServer = true
            else if view.cache.lastRequest
                i = 0
                iLen = aoData.length

                while i < iLen
                    param = aoData[i]
                    last_param = view.cache.lastRequest[i]
                    is_param_array = Array.isArray(param)
                    is_last_param_array = Array.isArray(last_param)
                    if is_param_array and is_last_param_array

                        # The params are both arrays, compare them.
                        unless param.length is last_param.length

                            # The array lengths don't match, assume the server is needed.
                            bNeedServer = true
                            break # **EXIT**
                        else

                            # Need to compare the actual array contents.
                            param_index = 0

                            while param.length
                                p1 = param[param_index]
                                p2 = last_param[param_index]
                                unless p1.value is p2.value
                                    bNeedServer = true
                                    break # **EXIT**
                                param_index++
                    else if is_param_array and not is_last_param_array or not is_param_array and is_last_param_array

                        # Parameter type mismatch.
                        bNeedServer = true
                        break # **EXIT**
                    else if param.name isnt "iDisplayStart" and param.name isnt "iDisplayLength" and param.name isnt "sEcho"
                        unless param.value is last_param.value
                            bNeedServer = true
                            break # **EXIT**
                    i++

            # Store the request for checking next time around
            view.cache.lastRequest = aoData.slice()
            if bNeedServer
                iPipe = undefined
                if view.options.iPipe and _.isNumber(view.options.iPipe)
                    iPipe = view.options.iPipe
                else
                    iPipe = 10
                if iRequestStart < view.cache.iCacheLower
                    iRequestStart = iRequestStart - (iRequestLength * (iPipe - 1))
                    iRequestStart = 0  if iRequestStart < 0
                view.cache.iCacheLower = iRequestStart
                view.cache.iCacheUpper = iRequestStart + (iRequestLength * iPipe)
                view.cache.iDisplayLength = view.get_key(aoData, "iDisplayLength")
                view.set_key aoData, "iDisplayStart", iRequestStart
                view.set_key aoData, "iDisplayLength", iRequestLength * iPipe

                # Block the UI before the AJAX call.
                view.block_element view.$el

                # Callback processing
                $.getJSON(sSource, aoData,(json) ->
                    view.cache.lastJson = jQuery.extend(true, {}, json)
                    json[ajax_data_prop].splice 0, view.cache.iDisplayStart - view.cache.iCacheLower  unless view.cache.iCacheLower is view.cache.iDisplayStart
                    json[ajax_data_prop].splice view.cache.iDisplayLength, json[ajax_data_prop].length
                    fnCallback json
                    return
                ).always ->

                    # Unblock the UI.
                    view.unblock view.$el
                    return

            else
                try

                # Block the UI before processing.
                    view.block_element view.$el
                    json = jQuery.extend(true, {}, view.cache.lastJson)
                    json.sEcho = sEcho

                    # Update the echo for each response
                    json[ajax_data_prop].splice 0, iRequestStart - view.cache.iCacheLower
                    json[ajax_data_prop].splice iRequestLength, json[ajax_data_prop].length
                    fnCallback json
                finally
                # Unblock the UI.
                    view.unblock view.$el
            return

        #
        # Date formatter instance.
        #
        date_formatter: (index) ->
            {
                mRender: (data, type, row) ->
                    utils.format_date_string data
                aTargets: [index]
            }

        #
        # Return the list of expanded rows.
        #
        expanded_rows: ->
            @_expanded_rows


        ###
        Expand the contents of a row.
        @param tr - the row.
        @param details_callback - function(tr, data) - returns the details HTML.
        ###
        expand__collapse_row: (tr, details_callback) ->
            expanded = @expanded_rows()
            index = $.inArray(tr, expanded)
            if index is -1
                expand_icon = $(tr).find("i.expand")
                if expand_icon
                    expand_icon.removeClass "fa-plus-circle"
                    expand_icon.addClass "fa-minus-circle"
                expanded.push tr
                data = @get_data(tr)
                view.get_table().fnOpen tr, details_callback(data), "details"
            else
                collapse_icon = $(tr).find("i.expand")
                if collapse_icon
                    collapse_icon.removeClass "fa-minus-circle"
                    collapse_icon.addClass "fa-plus-circle"
                expanded.splice index, 1
                @table_el.fnClose tr
            return

    #
    # Retrieve the default dataTables settings.
    #
    get_datatables_settings = (parent, settings) ->
        defaults =
            iDisplayLength: 10
            aLengthMenu: [
                10
                25
                50
                100
                200
            ]
            sDom: "t"
            bAutoWidth: false
            sPaginationType: 'bs_full'
            bSortClasses: false
            bProcessing: false
            asStripeClasses: []
            fnServerData: (sSource, aoData, fnCallback) ->
                parent.pipeline sSource, aoData, fnCallback
                return

            fnRowCallback: (row, data, display_index, display_index_full) ->
                parent.trigger 'row:callback', row, data, display_index, display_index_full

                click_handler = (ev) ->

                    # Select the row.
                    $(row).addClass("active").siblings().removeClass "active"

                    # Trigger a click event.
                    parent.trigger "click", parent.get_data(ev.currentTarget), ev
                    return


                # Remove any existing click events for the row.
                $(row).unbind "click", click_handler

                # Bind a click event to the row.
                $(row).bind "click", click_handler
                row

            fnCreatedRow: (nRow, data, iDataIndex) ->
                parent.trigger "row:created", nRow, data, iDataIndex
                return

            fnInitComplete: (oSettings, json) ->
                parent.trigger "load", oSettings, json
                return

            fnDrawCallback: (oSettings) ->
                parent.trigger "draw", oSettings
                parent.trigger "empty"  if parent.length() is 0
                return

        results = {}

        for k, v of defaults
            results[k] = v

        for k, v of settings
            results[k] = v

        results

    # Export the table class.
    TableView
