define (require) ->
    View = require 'uac/components/View'

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
            sPaginationType: "bootstrap"
            bSortClasses: false
            bProcessing: false
            asStripeClasses: []
            fnServerData: (sSource, aoData, fnCallback) ->
                parent.pipeline sSource, aoData, fnCallback
                return

            fnRowCallback: (nRow, data, iDisplayIndex, iDisplayIndexFull) ->
                click_handler = (ev) ->

                    # Select the row.
                    $(nRow).addClass("active").siblings().removeClass "active"

                    # Trigger a click event.
                    parent.trigger "click", parent.get_data(ev.currentTarget), ev
                    return


                # Remove any existing click events for the row.
                $(nRow).unbind "click", click_handler

                # Bind a click event to the row.
                $(nRow).bind "click", click_handler
                nRow

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


        #return $.extend(true, defaults, settings);
        results = {}
        _.each Object.keys(defaults), (key) ->
            results[key] = defaults[key]
            return

        _.each Object.keys(settings), (key) ->
            results[key] = settings[key]
            return

        results

    class TableView extends View
        initialize: ->
            if @collection
                @listenTo @collection, "sync", @render
                @listenTo @collection, "reset", @render
            return

        highlight_row: (nRow) ->
            $(nRow).addClass("active").siblings().removeClass "active"
            return


        ###
        Initiate a click event on a row.
        @param index_or_node - the row index or row node.
        @returns the row node or undefined.
        ###
        select_row: (index_or_node) ->
            if typeof index_or_node is "number"
                length = @length()
                if @length() <= 0
                    `undefined`
                else if index_or_node + 1 > length
                    `undefined`
                else
                    pos = @get_selected_position()
                    unless pos is index_or_node

                        # Only select if we are not already on the row.
                        node = @get_nodes(index_or_node)
                        $(node).click()  if node
                        node
                    else
                        `undefined`
            else if index_or_node
                $(index_or_node).click()
                index_or_node
            else if index_or_node is null or index_or_node is `undefined`

                # Unselect all rows.
                @$("tr.active").removeClass "active"
            else
                `undefined`
            return

        get_selected: ->
            @$ "tr.active"

        get_selected_position: ->
            selected = @get_selected()
            if selected isnt `undefined` and selected.length is 1
                @get_position selected.get(0)
            else
                -1

        get_selected_data: ->
            selected = @get_selected()
            if selected isnt `undefined` and selected.length is 1
                pos = @get_position(selected.get(0))
                @get_data pos
            else
                `undefined`

        get_current_page: ->
            settings = @get_settings()
            Math.ceil(settings._iDisplayStart / settings._iDisplayLength) + 1

        get_total_rows: ->
            if @get_settings().oInit.bServerSide
                @get_settings()._iRecordsTotal
            else
                @get_nodes().length

        get_total_pages: ->
            settings = @get_settings()
            Math.ceil @get_total_rows() / settings._iDisplayLength

        is_prev: ->
            pos = @get_selected_position()
            pos > 0

        is_next: ->
            pos = @get_selected_position()
            pos + 1 < @length()

        peek_prev_data: ->
            selected = @get_selected()
            if selected isnt `undefined` and selected.length is 1
                pos = @get_position(selected.get(0))
                return @get_data(pos - 1)

            # No previous.
            `undefined`

        peek_next_data: ->
            if @is_next()
                selected = @get_selected()
                if selected isnt `undefined` and selected.length is 1
                    pos = @get_position(selected.get(0))
                    return @get_data(pos + 1)

            # No next.
            `undefined`

        prev: ->
            selected = @get_selected()
            if selected isnt `undefined` and selected.length is 1
                pos = @get_position(selected.get(0))
                @select_row pos - 1
            return

        next: ->
            if @is_next()
                selected = @get_selected()
                if selected isnt `undefined` and selected.length is 1
                    pos = @get_position(selected.get(0))
                    @select_row pos + 1
            return

        is_prev_page: ->
            @get_current_page() isnt 1

        is_next_page: ->
            @get_current_page() < @get_total_pages()

        prev_page: ->
            if @is_prev_page()
                # set page takes an index.
                @set_page(@get_current_page())
            return

        next_page: ->
            if @is_next_page()
                # set page takes an index.
                @set_page(@get_current_page())
            return

        ###
        Set the current page of the table.
        @param page_index - the zero based page index.
        ###
        set_page: (page_index) ->
            current_page = @get_current_page()
            if page_index + 1 > current_page
                @_page_next = true
            else
                @_page_prev = true
            @get_table().fnPageChange page_index

        length: ->
            @$el.fnGetData().length

        get_dom_table: ->
            @$el.get 0

        get_table: ->
            @$el.dataTable()

        get_nodes: (index) ->
            @$el.fnGetNodes index

        update: (data, tr_or_index, col_index, redraw, predraw) ->
            @get_table().fnUpdate data, tr_or_index, col_index, redraw, predraw

        draw: (re) ->
            @get_table().fnDraw re
            return

        get_data: (index_or_node, index) ->
            @get_table().fnGetData index_or_node, index

        get_position: (node) ->
            @$el.fnGetPosition node

        get_absolute_index: (node) ->
            if @get_settings().oInit.bServerSide
                (@get_current_page() - 1) * @get_settings()._iDisplayLength + @get_position(node)
            else
                @get_position node

        get_settings: ->
            @$el.fnSettings()

        get_search: ->
            result = ""
            settings = @get_settings()
            result = settings.oPreviousSearch.sSearch  if settings.oPreviousSearch and settings.oPreviousSearch.sSearch
            result

        is_datatable: ->
            $.fn.DataTable.fnIsDataTable @get_dom_table()

        is_server_side: ->
            @get_settings().oInit.bServerSide

        reload: (row_index) ->
            @clear_cache()
            @_row_index = row_index  if row_index isnt `undefined`
            @$el.fnDraw false
            return

        refresh: (value_pair) ->
            @clear_cache()
            @_value_pair = value_pair  if value_pair
            @$el.fnDraw false
            return

        destroy: ->

            # Remove any listeners.
            @undelegateEvents()

            # Destroy the old table if it exists.
            dom_element = @get_dom_table()
            unless dom_element
                log.error "dom element is null."
                return
            id = null
            id = dom_element.id  if _.has(dom_element, "id")
            if $.fn.DataTable.fnIsDataTable(dom_element)
                log.debug "Destroying DataTable with id: " + id
                table = @$el.dataTable()
                @trigger "destroy", table

                # Destroy the old table.
                table.fnDestroy false
                table.empty()
            else
                log.debug "Element with id: %s is not of type DataTable, skipping... #{id}"
            return


        ###
        Render the table.  If you are obtaining data from a collection then don't invoke this method, call fetch()
        instead.  If obtaining data via server side ajax then this method can be called with server side parameters.

        table.render({server_params: {suppression_id: suppression_id}});

        @param params - the server side ajax parameters.  A map keyed by the name server_params.
        @returns {*}
        ###
        render: (params) ->
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

            # Construct the table settings.
            settings = get_datatables_settings(view, view.options)

            # Apply any parameters passed to the settings.
            if params
                if params.server_params isnt null
                    server_params = params.server_params
                    if server_params
                        log.debug "Setting server params..."
                        settings.fnServerParams = (aoData) ->
                            _.each Object.keys(server_params), (key) ->
                                log.debug "Setting param #{key} and value #{server_params[key]}"
                                aoData.push
                                    name: key
                                    value: server_params[key]

                                return

                            return
                else settings.aaData = params.aaData  if params.aaData isnt null

            # If a collection is defined then use the data from the collection.
            settings.aaData = view.collection.toJSON()  if view.collection

            # The following block is one time initialization for the table view and is specifically placed in the render
            # function to allow sub-classes to define an initialize method without having to worry about calling the
            # superclass initialization.
            view.run_once "TableView::render::init", ->

                # Listen to draw events to account for the fact that datatables does not fire page change events.  This code
                # makes up for that shortcoming by manually determining when the user has used the previous next component to
                # page through the table.
                view.listenTo view, "draw", ->
                    if view._page_prev

                        # User has iterated through the table to the previous page.
                        view.trigger "page", view.get_current_page()

                        # Select the last record in the current view.
                        view.select_row view.length() - 1

                        # Clear the flag.
                        view._page_prev = false
                    else if view._page_next

                        # User has iterated to through the table to the next page.
                        view.trigger "page", view.get_current_page()

                        # Select the next record in the view.
                        view.select_row 0

                        # Clear the flag.
                        view._page_next = false
                    if view._row_index isnt `undefined`

                        # During a refresh reload operation a row index to select has been specified.  Attempt to select
                        # the row that corresponds to the index.
                        view.select_row view._row_index
                        view._row_index = `undefined`
                    else if view._value_pair

                        # During a refresh/reload operation a value to select has been specified.  Attempt to select the
                        # row that corresponds to the supplied name value pair.
                        log.debug "Attempting to reselect table row value: name=#{view._value_pair.name}, value=#{view._value_pair.value}"

                        # Attempt to select the row related to the value pair after a draw event.
                        found = false
                        nodes = @get_nodes()
                        i = 0

                        while i < nodes.length
                            node = nodes[i]
                            data = @get_data(node)
                            if view._value_pair.name and view._value_pair.value and data[view._value_pair.name] is view._value_pair.value

                                # Select the node.
                                @select_row node
                                found = true
                                break
                            i++

                        # If the matching row was not found it is assumed that it was deleted, select the first
                        # row instead.
                        @select_row 0  unless found

                        # Clear the value pair.
                        view._value_pair = `undefined`
                    return

                return


            # Create the table.
            table = view.$el.dataTable(settings)
            view.delegateEvents "click tr i.expand": "on_expand"
            if view.$el.parent()

                # Assign the bootstrap class to the length select.
                length_selects = $(".dataTables_wrapper select")
                _.each length_selects, (length_select) ->
                    unless $(length_select).hasClass("form-control")
                        $(length_select).addClass "form-control"
                        $(length_select).css "min-width", "85px"
                    return

            view

        on_expand: (ev) ->
            ev.stopPropagation()
            tr = $(ev.currentTarget).closest("tr")
            @trigger "expand", tr.get(0)
            false

        fetch: (params) ->
            view = this
            if params
                view.params = params
            else
                view.params = `undefined`
            if view.collection
                if params

                    # User has supplied options to the fetch call.
                    if not params.success and not params.error

                        # Has not overidden the success and error callbacks, block for them.
                        params.success = ->
                            UAC.unblock view.$el
                            return

                        params.error = ->
                            UAC.unblock view.$el
                            return

                        UAC.block_element view.$el
                        view.collection.fetch params
                    else

                        # Don't do any blocking.
                        view.collection.fetch params
                else

                    # Block the UI before the fetch.
                    UAC.block_element view.$el
                    view.collection.fetch
                        success: ->

                            # Unblock the ui.
                            UAC.unblock view.$el
                            return

                        error: ->

                            # Unblock the ui.
                            UAC.unblock view.$el
                            return

            else
                view.render server_params: params
            return

        close: ->
            @destroy()
            @remove()

            # Fire an event after cleaning up.
            @trigger "close"
            return

        update_row: (row_search_key, row_search_value, row_update_key, row_update_value, row_column_index) ->
            view = this
            nodes = view.get_nodes()
            i = 0

            while i < nodes.length
                node = nodes[i]
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


        ###
        Escape a cells contents.
        ###
        escape_cell: (row, index) ->
            col = @get_settings().aoColumns[index]
            td = $("td:eq(#{index}", row)
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

        clear_cache: ->
            @cache = `undefined`  if @cache
            return

        pipeline: (sSource, aoData, fnCallback) ->
            view = this
            ajax_data_prop = view.get_settings().sAjaxDataProp

            # Initialize the cache the first time.
            view.cache =
                iCacheLower: -1  unless view.cache

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
                UAC.block_element view.$el

                # Callback processing
                $.getJSON(sSource, aoData,(json) ->
                    view.cache.lastJson = jQuery.extend(true, {}, json)
                    json[ajax_data_prop].splice 0, view.cache.iDisplayStart - view.cache.iCacheLower  unless view.cache.iCacheLower is view.cache.iDisplayStart
                    json[ajax_data_prop].splice view.cache.iDisplayLength, json[ajax_data_prop].length
                    fnCallback json
                    return
                ).always ->

                    # Unblock the UI.
                    UAC.unblock view.$el
                    return

            else
                try

                # Block the UI before processing.
                    UAC.block_element view.$el
                    json = jQuery.extend(true, {}, view.cache.lastJson)
                    json.sEcho = sEcho

                    # Update the echo for each response
                    json[ajax_data_prop].splice 0, iRequestStart - view.cache.iCacheLower
                    json[ajax_data_prop].splice iRequestLength, json[ajax_data_prop].length
                    fnCallback json
                finally
                # Unblock the UI.
                    UAC.unblock view.$el
            return

        date_formatter: (index) ->
            mRender: (data, type, row) ->
                UAC.format_date_string data

            aTargets: [index]


        ###
        Return the list of expanded rows.
        ###
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
                @get_table().fnClose tr
            return


    TableView
