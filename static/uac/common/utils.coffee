define (require) ->
    require 'blockui'
    Backbone = require 'backbone'
    moment = require('moment')


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
                'margin-top': '50%',
                width: '100%',
                border: "0px solid #cccccc",
                padding: '0px',
                opacity: .8,
                backgroundColor: ''
            ),
            overlayCSS: (
                backgroundColor: get_styles().overlay_color,
                opacity: .5
            ),
            baseZ: 5000
        )

    block = (ev) ->
        $.blockUI get_blockui_options()

    ###
        TODO: Is this being used???
    ###
    block_element_remove = (el, message) ->
        $(el).block(get_blockui_options('<img src="/static/img/ajax-loader.gif">'))

    block_element = (el, message) ->
        $(el).block(get_blockui_options('<img src="/static/img/ajax-loader.gif">'))

    unblock = (el) ->
        if el
            $(el).unblock()
        else
            $.unblockUI()

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
            delay = options.delay if options.delay
            max_intervals = options.max_intervals  if options.max_intervals

        # Set up the polling loop.
        interval_count = 0
        timer_id = setInterval(->
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
        $.bootstrapGrowl message,
            type: "info"
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

    ###
    Retrieve the UAC specific CSS styles.
    ###
    get_styles = ->
        unless this._styles
            this._styles = {}
            body_style = window.getComputedStyle(document.body)
            if body_style and body_style.getPropertyValue("background-color")
                this._styles.overlay_color = body_style.getPropertyValue("background-color")
            else
                this._styles.overlay_color = "#cccccc"
        this._styles

    ###
    Clear the UAC CSS styles, will be recalculated on next usage.
    ###
    reset_styles = ->
        this._styles = `undefined`
        return


    ###
    Change the current UAC theme.
    @param theme - the theme name.
    ###
    set_theme = (theme) ->
        url = undefined
        unless theme

            # Use the default.
            url = "/static/bootstrap/css/bootstrap-default.min.css"
        else

            # Generate the theme url.
            url = "/static/bootstrap/css/bootstrap.min-#{theme}.css"

        # Reload the CSS.
        $("#bootstrap").attr "href", url
        set_cookie
            name: "theme"
            value: theme
            http_only: false
            expires: moment().add("y", 1).utc()


        # Clear the overlay color since the theme has been changed.
        reset_styles()
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
        domain = options.domain or `undefined`
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
        cookie_string = document.cookie
        if cookie_string is ""
            return {}
        else
            results = {}
            for cookie in cookie_string.split("; ")
                p = cookie.indexOf("=")
                name = cookie.substring(0, p)
                value = cookie.substring(p + 1)
                value = decodeURIComponent(value)
                results[name] = value
                return
            results

    storage = (k, o) ->
        unless window.localStorage
            log.warn "localStorage not available!"
            {}
        else if arguments.length is 1
            value = window.localStorage.getItem(k)
            (if value then JSON.parse(value) else `undefined`)
        else if arguments.length > 1
            if o

                # Set the object.
                window.localStorage.setItem k, JSON.stringify(o)
            else
                window.localStorage.removeItem k
            `undefined`
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
            log.warn "sessionStorage not available!"
            {}
        else if arguments.length is 1

            # Retrieve the object.
            value = window.sessionStorage.getItem(k)
            (if value then JSON.parse(value) else `undefined`)
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
        usersettings = {}    unless usersettings
        if options
            #_.each _.keys(options), (key) ->
            for key in options
                value = options[key]
                if value
                    usersettings[key] = options[key]
                else
                    delete usersettings[key]
                return

            storage "usersettings", usersettings
        (if usersettings then usersettings else {})


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
                log.warn "Recent value is not of type array: " + JSON.stringify(recent)
            else if not options.name or not options.type or not options.values

                # Options parameter is not valid.
                log.warn "Recent option is incomplete: " + JSON.stringify(options)
            else

                # Keep track of the recent items.

                # Start removing the last element.
                recent.pop()    if recent.length >= 10
                recent.unshift options

                # Update the list of recent values in local storage.
                storage "recent", recent

        # Return the recent values.
        recent

    (
        block: block
        unblock: unblock
        block_element: block_element
        random_string: random_string
        format_date_string: format_date_string
        run_template: run_template
        display_info: display_info
        display_error: display_error
        display_warn: display_warn
        display_success: display_success
        usersettings: usersettings
        session: session
        recent: recent
        set_theme: set_theme
    )