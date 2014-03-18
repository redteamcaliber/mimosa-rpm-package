define (require) ->
    uac_utils = require('uac/common/utils')
    CollapsableContentView = require 'uac/views/CollapsableContentView'

    ###
        Extend the Backbone view class.
    ###
    class View extends Backbone.View

        show: ->
            @$el.fadeIn().show()

        hide: ->
            @.$el.fadeOut().hide()

        run_once: (key, init_function) ->
            if not this[key]
                this[key] = true
                init_function()
                return true
            else
                return false

        render: ->
            if @do_render isnt undefined
                @do_render.apply(@, arguments)
            return @

        ###
            Return the list of event listeners.
        ###
        get_listeners: ->
            return if @_listeners then _.values(@_listeners) else []

        ###
            Apply a template to the current element.

            Params:
                namespace - the namespace where the template exists.
                template - the template.
                context - the context.
        ###
        apply_template: (templates, template, context) ->
            @$el.html uac_utils.run_template(templates, template, context)

        block: ->
            uac_utils.block_element @$el

        block_element: (el, message) ->
            uac_utils.block_element(el, message)

        unblock: (el) ->
            if el then uac_utils.unblock el else uac_utils.unblock @.$el

        collapse: (el) ->
            if @$el.hasClass 'collapsable-header'
                new CollapsableContentView
                    el: '#' + @$el.attr('id'),
                    title: @$el.attr('collapsable-title')

            for collapsable in @$el.find('.collapsable-header')
                new CollapsableContentView (
                    el: collapsable
                    title: $(collapsable).attr('collapsable-title')
                )
            if @$el.hasClass 'collapsable'
                new CollapsableContentView (
                    el: '#' + @$el.attr('id')
                    title: @$el.attr('collapsable-title')
                    display_toggle: false
                )
            for collapsable in @$el.find('.collapsable')
                new CollapsableContentView (
                    el: collapsable
                    title: $(collapsable).attr('collapsable-title')
                    display_toggle: false
                )
            return

        display_info: (message) ->
            uac_utils.display_info(message)

        display_warn: (message) ->
            uac_utils.display_warn(message)

        display_error: (message) ->
            uac_utils.display_error(message)

        display_success: (message) ->
            uac_utils.display_success(message)
