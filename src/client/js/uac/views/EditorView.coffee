define (require) ->

    Marionette = require 'marionette'
    ace = require 'ace/ace'

    utils = require 'uac/common/utils'
    Evented = require 'uac/common/mixins/Evented'


    dark_themes = [
        'amelia'
        'cyborg'
        'darkly'
        'slate'
        'superhero'
    ]


    #
    # Ace editor view class.
    #
    class EditorView extends Marionette.ItemView
        initialize: (options) ->
            @options = options

        render: ->
            if @options and @options.value
                @$el.html @options.value

            @editor = ace.edit(@el)

            # Set the position.
            @$el.css 'position', if @options and @options.position then @options.position else 'relative'

            if @options and @options.width
                # Set the width.
                @$el.css 'width', @options.width

            if @options and @options.font_size
                font_size = options.font_size
            else
                # Set the font to a default size.
                theme_font_size = utils.get_font_size()
                if theme_font_size and theme_font_size == 'small'
                    font_size = 10
                else if theme_font_size and theme_font_size == 'tiny'
                    font_size = 9
                else
                    font_size = 12
            @font_size(font_size)

            # Set the theme.
            if @options and @options.theme
                @editor.setTheme @options.theme
            else
                # Use the default theme.
                theme = utils.get_theme()
                if theme
                    if theme == 'slate'
                        @editor.setTheme 'ace/theme/tomorrow_night'
                    else if theme == 'cyborg'
                        @editor.setTheme 'ace/theme/clouds_midnight'
                    else if theme in dark_themes
                        @editor.setTheme 'ace/theme/idle_fingers'
                    else
                        @editor.setTheme 'ace/theme/chrome'
                else
                    @editor.setTheme 'ace/theme/chrome'

            if @options and @options.mode
                # Set the mode.
                @session().setMode @options.mode

            if @options and @options.read_only
                # Set the editor to read-only.
                @editor.setReadOnly @options.read_only

            if @options and @options.wrap isnt undefined
                # Set the word wrap options.
                @wrap @options.wrap

            if @options and @options.print_margin isnt undefined
                @print_margin @options.print_margin
            else
                @print_margin false

            if @options and @options.highlight isnt undefined
                @highlight @options.highlight

            # Set the height.
            if @options and @options.height
                if @options.height == 'auto'
                    # Display all of the content.
                    @editor.setOptions
                        maxLines: @session().getScreenLength()
                else
                    @$el.css 'height', @options.height
            else
                @$el.css 'height', if @options and @options.height then @options.height else '300px'

        value: ->
            if arguments.length == 0
                @editor.getValue()
            else
                @editor.setValue arguments[0]

        clear: ->
            @value ''
            @

        font_size: (size) ->
            if arguments.length == 0
                return @$el.css('font-size')
            else
                @editor.setFontSize arguments[0]
                return @

        read_only: ->
            if arguments.length == 0
                return @editor.getReadOnly()
            else
                @editor.setReadOnly arguments[0]
                return @

        session: ->
            @editor.getSession()

        wrap: ->
            if arguments.length == 0
                return @session().getUseWrapMode()
            else
                @session().setUseWrapMode arguments[0]
                return @

        print_margin: ->
            if arguments.length == 0
                return @editor.getShowPrintMargin()
            else
                @editor.setShowPrintMargin arguments[0]
                return @

        highlight: ->
            if arguments.length == 0
                return @editor.getHighlightActiveLine()
            else
                @editor.setHighlightActiveLine arguments[0]
                return @

    utils.mixin EditorView, Evented

    return EditorView