define (require) ->

    _ = require 'underscore'
    Backbone = require 'backbone'
    utils = require 'uac/common/utils'

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
            tpl = templates[template]
            @.$el.html tpl(utils.default_view_helpers(context))

        block: ->
            utils.block_element @.$el

        block_element: (el, message) ->
            utils.block_element(el, message)

        unblock: ->
            utils.unblock @.$el

        collapse: ->
            utils.collapse(@el)

        display_info: ->
            utils.display_info()

        display_warn: ->
            utils.display_warn()

        display_error: ->
            utils.display_error()

        display_success: ->
            utils.display_success()