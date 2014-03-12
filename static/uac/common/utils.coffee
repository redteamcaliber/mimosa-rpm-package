define (require) ->
    $ = require 'jquery'

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


    # Export functions.
    return (
        block: block
        unblock: unblock
        block_element: block_element
        random_string: random_string
    )