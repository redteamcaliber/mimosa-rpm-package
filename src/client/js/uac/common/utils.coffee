define (require) ->
    Cocktail = require 'cocktail'
    Backbone = require('backbone')
    require 'blockui'
    moment = require('moment')
    require('bootstrap_growl')

    CollapsableContentView = require 'uac/views/CollapsableContentView'

    ###
        Retrieve the default block ui options.

        Params:
            message - the message to display.
        Returns:
            returns the default options.
    ###
    get_blockui_options = (message) ->
        (
            message: if message then message else '',
            css: (
                top: '50%'
                centerX: true
                centerY: true
                backgroundColor: ''
                border: 'none'
                padding: '0px'
            )
            overlayCSS: (
                backgroundColor: get_styles().body_color
                opacity: .5
            )
            baseZ: 5000
        )

    block = () ->
        $.blockUI get_blockui_options('<img src="/static/css/img/ajax-loader.gif">')
        return

    block_element = (el, loading) ->
        if loading
            options = get_blockui_options('<img src="/static/css/img/ajax-loader.gif">')
        else
            options = get_blockui_options()
        $(el).block(options)
        return

    #
    # Unblock the
    #
    unblock = ->
        if arguments.length == 1 and arguments[0]
            $(arguments[0]).unblock()
        else
            $.unblockUI()
        return

    collapse =  (el) ->
        el = $(el)
        if el.hasClass 'collapsable-header'
            new CollapsableContentView
                el: '#' + el.attr('id'),
                title: el.attr('collapsable-title')

        for collapsable in el.find('.collapsable-header')
            new CollapsableContentView
                el: collapsable
                title: $(collapsable).attr('collapsable-title')
        if el.hasClass 'collapsable'
            new CollapsableContentView
                el: '#' + el.attr('id')
                title: el.attr('collapsable-title')
                display_toggle: false
        for collapsable in el.find('.collapsable')
            new CollapsableContentView
                el: collapsable
                title: $(collapsable).attr('collapsable-title')
                display_toggle: false

    #
    # Fetch a model or collection with blocking support.
    #
    fetch = (data, el, params) ->
        if data
            local_params = {}
            for k, v of params
                if k != 'success' and k != 'error'
                    local_params[k] = v
            local_params.success = (model, response, options) =>
                try
                    if params.success
                        # Invoke the callers success function.
                        params.success model, response, options
                catch e
                    console.error e.stack
                    display_error("Error processing fetched data: #{e}")
                finally
                    unblock el
            local_params.error = (model, response, options) =>
                try
                    if params.error
                        # Invoke the callers error function.
                        params.error model, response, options
                    else
                        display_response_error('Error while fetching data', response);
                catch e
                    console.error e.stack
                    display_error "Error while fetching data: #{e}"
                finally
                    unblock el
            if el
                block_element el
            else
                block()
            return data.fetch local_params


    ###
        Generate a random string of the specified length.

        Params:
            len - the length of the generated string.
    ###
    random_string = (len) ->
        if not len
            len = 10

        result = ''
        charset = 'abcdefghijklmnopqrstuvwxyz'

        for i in [0...len]
            result += charset.charAt(Math.floor(Math.random() * charset.length))

        return result.trim()


    ###
    Wait for a task to complete using a poll function to check whether we have reached an exit condition.

    Params:
        params - the parameters to send to the poll function.
        poll_fn - function(params, callback(err, is_complete, result)).
        completed_fn - function(err, is_complete, result)
        options - delay=milliseconds in between poll attempts (default=2000), max_intervals=max number of poll attempts (default=5).
    ###
    wait_for = (params, poll_fn, completed_fn, options) ->
        delay = 2000
        max_intervals = 5

        # Override defaults.
        if options
            if options.delay
                delay = options.delay
            if options.max_intervals
                max_intervals = options.max_intervals

        console.debug "Polling for #{max_intervals} intervals of #{delay}ms."

        # Set up the polling loop.
        interval_count = 1
        timer_id = setInterval( ->
            try
            # Check for an exit condition.
                if interval_count >= max_intervals

                    # Exceed maximum number of tries.
                    clearInterval timer_id
                    completed_fn null, false
                else
                    # Invoke the poll function.
                    poll_fn params, (err, is_complete, result) ->
                        if err
                            # Error, exit.
                            clearInterval timer_id
                            completed_fn err, false
                        else if is_complete
                            # Complete, exit.
                            clearInterval timer_id
                            completed_fn null, true, result
                        else
                            # Increment the interval count.
                            interval_count = interval_count + 1
                        return
            catch e
            # Error
                clearInterval timer_id
                completed_fn (if e.stack then e.stack else e)
            return
        , delay)
        return

    display_info = (message) ->
        message = (if message then message += "&nbsp;" else message)
        $.otstrapGrowl message,
            type: 'info'
            width: "auto"
            delay: 10000
        return

    display_warn = (message) ->
        message = (if message then message += "&nbsp;" else message)
        $.bootstrapGrowl message,
            type: "warn"
            width: "auto"
            delay: 10000
        return

    display_success = (message) ->
        message = (if message then message += "&nbsp;" else message)
        $.bootstrapGrowl message,
            type: "success"
            width: "auto"
            delay: 10000
        return

    display_error = (message) ->
        message = (if message then message += "&nbsp;" else message)
        $.bootstrapGrowl message,
            type: "danger"
            width: "auto"
            delay: 15000
        return

    #
    # Retrieve the related error from the response.
    #
    get_response_error = (response) ->
        if response && response.responseText then response.responseText else 'Response text not defined.'

    #
    # Display a message with the error from the response.
    #
    display_response_error = (message, response) ->
        error = get_response_error response
        display_error "#{message} - #{error}"
        return

    #
    # Backbone Overrides.
    #

    ###
    Override the default backbone POST behavior to send the CSRF token.
    ###
    _sync = Backbone.sync
    Backbone.sync = (method, model, options) ->
        options.beforeSend = (xhr) ->
            token = $("meta[name=\"csrf-token\"]").attr("content")
            xhr.setRequestHeader "X-CSRF-Token", token
            return

        _sync method, model, options


    #
    # JQuery Stuff.
    #

    ###
    Required to make jQuery drop the subscripts off of array parameters.
    ###
    $.ajaxSettings.traditional = true

    #
    # Date Formatting.
    #
    DATE_FORMAT = "YYYY-MM-DD HH:mm:ss"
    format_date_string = (s) ->
        (if s then moment(s, "YYYY-MM-DDTHH:mm:ss.SSS").format(DATE_FORMAT) else "")

    format_unix_date = (unix) ->
        if unix
            input = undefined
            if typeof unix is "string"
                input = parseFloat(unix)
            else
                input = unix
            moment.unix(input).format DATE_FORMAT
        else
            ""

    ###
    Add the default view helpers to the context.

    Params:
        context - the context.
    ###
    default_view_helpers = (context) ->
        if not context
            context = {}
        context.stringify = JSON.stringify
        context.format_date = format_date_string
        context

    ###
    Render a template.
    ###
    run_template = (templates, template_name, context) ->
        if templates
            template = templates[template_name]
            if template
                return template(default_view_helpers(context))
            else
                console.error "Unable to load template: #{template_name}"
                return
        else
            console.error "Unable to load template: #{template_name}, templates is undefined."
            return

    reset_styles = ->
        this._styles = undefined

    #
    # Retrieve the UAC specific CSS styles.
    #
    get_styles = (reset) ->
        if reset or not this._styles
            this._styles = {}

            source_el = $ '#uac-style-div'

            # Get the style element.
            if style_el and style_el.length > 0
                # Clear the existing style element.
                style_el.prop("type", "text/css").html('')
            else
                # Create a new style element.
                style_el = $ '<style id="uac-theme-style">'
                # Add the style section to the head of the document.
                style_el.appendTo("head")

            # Obtain the style properties.

            # Get the shaded color from a well element.
            well_el = source_el.find('.well')
            well_style = if well_el then window.getComputedStyle(well_el.get(0)) else undefined
            if well_el && well_style
                well_style = window.getComputedStyle(well_el.get(0))
                well_color = well_style.getPropertyValue('background-color')
            else
                well_color = '#cccccc'
            # Get the body color from the body element.
            body_style = window.getComputedStyle(document.body)
            if body_style and body_style.getPropertyValue("background-color")
                body_color = body_style.getPropertyValue("background-color")
            else
                body_color = "#cccccc"
            # Get the primary color from the primary element.
            primary_el = source_el.find('.btn-primary')
            primary_style = if primary_el then window.getComputedStyle(primary_el.get(0)) else undefined
            if primary_el and primary_style
                primary_color = primary_style.getPropertyValue("background-color")
            else
                primary_color = "#2a9fd6"

            # The html to add.
            html = '\n'

            # Generate the style sheet.

            # The uac-theme-shaded class.
            #border: 1px solid rgb(236, 240, 241);
            html += ".uac-theme-well-background { background-color: #{well_color} }\n"
            html += ".uac-theme-primary-background { background-color: #{primary_color} }\n"
            # The uac-theme-body class.
            html += ".uac-theme-background { background-color: #{body_color} }\n"
            # The uac-theme-border classes.
            html += ".uac-theme-border { border: 1px solid #{well_color}; }"
            html += ".uac-theme-border-right { border-right: 1px solid #{well_color}; }"
            html += ".uac-theme-border-left { border-left: 1px solid #{well_color}; }"
            html += ".uac-theme-border-top { border-top: 1px solid #{well_color}; }"
            html += ".uac-theme-border-bottom { border-bottom: 1px solid #{well_color}; }"

            # Add the classes to the style section.
            style_el.prop("type", "text/css").html(html)

            this._styles.line_height = body_style.getPropertyValue('line-height')
            this._styles.font_size = body_style.getPropertyValue('font-size')
            this._styles.well_color = well_color
            this._styles.body_color = body_color
            this._styles.primary_color = primary_color

        this._styles

    #
    # Get the current theme.
    #
    get_theme = ->
        cookies = get_cookies()
        if cookies
            return cookies.theme
        else
            return undefined

    get_font_size = ->
        cookies = get_cookies()
        if cookies
            return cookies.font_size
        else
            return undefined

    #
    # Change the current UAC theme.
    #
    set_theme = (theme, fontSize) ->
        url = undefined
        if not theme || theme == 'default'
            # Use the default.
            url = "/static/css/bootstrap/bootstrap.min.css"
        else
            # Generate the theme url.
            url = "/static/css/bootswatch/bootstrap.#{theme}.#{fontSize}.min.css"

        # Reload the CSS.
        $("#bootstrap").attr "href", url

        # Update the theme cookie.
        set_cookie(name: "theme", value: theme, http_only: false, expires: moment().add("y", 1).utc())

        # Update the font cookie
        set_cookie(name: "font_size", value: fontSize, http_only: false, expires: moment().add("y", 1).utc())

        setTimeout ( ->
            # Clear the overlay color since the theme has been changed.  This needs to be on a slight delay to allow the
            # style shee to finish loading.
            get_styles(true)
        ), 100

        return

    ###
    Set a cookie.  Options available, name, value, path, domain, expires, secure, http_only.  domain defaults to the
    server hostname, secure defaults to true, http_only defaults to true, expires defaults to null (session).
    ###
    set_cookie = (options) ->
        console.assert options
        console.assert options.name

        name = options.name
        path = options.path or "/"
        domain = options.domain or undefined
        expires = options.expires or "null"
        value = options.value or ""
        secure = options.secure isnt false
        http_only = options.http_only isnt false

        # Clear any old cookies.
        document.cookie = "#{name}=; expires=; path=#{path}; Secure;"

        # Set the new cookie.
        cookie = "#{name}=#{encodeURIComponent(value)}; expires=#{expires}{; path=#{path};"
        if domain
            cookie += " Domain=#{domain};"
        if secure
            cookie += " Secure;"
        if http_only
            cookie += " HttpOnly;"
        document.cookie = cookie
        return

    get_cookies = ->
        cookie_string = window.document.cookie
        if not cookie_string or _.isEmpty cookie_string
            return {}
        else
            results = {}
            for cookie in cookie_string.split("; ")
                p = cookie.indexOf("=")
                name = cookie.substring(0, p)
                value = cookie.substring(p + 1)
                value = decodeURIComponent(value)
                results[name] = value
            return results

    #
    # Utility for storing and retrieving Javascript objects from browser local storage.  This function serializes and
    # deserialized the object values as necessary.
    #
    storage = (k, v) ->
        unless window.localStorage
            console.warn "localStorage not available!"
            {}
        else if arguments.length is 1
            value = window.localStorage.getItem(k)
            (if value then JSON.parse(value) else undefined)
        else if arguments.length > 1
            if v
                # Set the object.
                window.localStorage.setItem k, JSON.stringify(v)
            else
                window.localStorage.removeItem k
            undefined
        else
            local = window.localStorage
            (if local then JSON.parse(local) else {})


    ###
    Store or retrieve and item from session storage.
    @param k - the key (required).
    @param o - the value (optional).
    @returns the key value if only a key was specified.
    ###
    session = (k, o) ->
        unless window.sessionStorage
            console.warn "sessionStorage not available!"
            {}
        else if arguments.length is 1
            # Retrieve the object.
            value = window.sessionStorage.getItem(k)
            if value
                return JSON.parse value
            else
                return undefined
        else if arguments.length > 1
            if o
                window.sessionStorage.setItem k, JSON.stringify(o)
            else
                window.sessionStorage.removeItem k
        else
            session = window.sessionStorage
            (if session then JSON.parse(session) else {})
        return

    usersettings = (options) ->
        usersettings = storage("usersettings")
        if not usersettings
            usersettings = {}
        if options
            for key, value of options
                if value
                    usersettings[key] = options[key]
                else
                    delete usersettings[key]

            storage "usersettings", usersettings
        usersettings

    ###
    Params:
        options
    ###
    recent = (options) ->

        # Retrieve the recent values from local storage.
        value = storage("recent")
        recent = value or []
        if options
            unless Array.isArray(recent)

                # Recent should be an array.
                console.warn "Recent value is not of type array: " + JSON.stringify(recent)
            else if not options.name or not options.type or not options.values

                # Options parameter is not valid.
                console.warn "Recent option is incomplete: " + JSON.stringify(options)
            else

                # Keep track of the recent items.

                # Start removing the last element.
                recent.pop()    if recent.length >= 10
                recent.unshift options

                # Update the list of recent values in local storage.
                storage "recent", recent

        # Return the recent values.
        recent

    #
    # Mixin a list of objects.
    #
    mixin = ->
        Cocktail.mixin.apply(this, arguments)
        arguments[0]

    (
        block: block
        unblock: unblock
        block_element: block_element
        collapse: collapse
        default_view_helpers: default_view_helpers
        get_theme: get_theme
        format_date_string: format_date_string
        format_unix_date: format_unix_date
        display_info: display_info
        display_error: display_error
        get_response_error: get_response_error
        display_response_error: display_response_error
        display_warn: display_warn
        display_success: display_success
        usersettings: usersettings
        session: session
        storage: storage
        random_string: random_string
        recent: recent
        run_template: run_template
        set_theme: set_theme
        get_font_size: get_font_size
        get_styles: get_styles
        wait_for: wait_for
        mixin: mixin
        fetch: fetch
    )