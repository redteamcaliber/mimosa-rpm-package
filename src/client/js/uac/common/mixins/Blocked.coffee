#
# Adds blocking support into a View class.
#
define (require) ->

    utils = require 'uac/common/utils'

    Blocked = (

        #
        # Block the UI.
        #
        block: ->
            if arguments.length == 0
                utils.block_element @$el
            else
                utils.block_element arguments[0]

        #
        # Unblock the UI.
        #
        unblock: ->
            if arguments.length == 0
                utils.unblock @$el
            else
                utils.unblock arguments[0]

        #
        # Obtain a parameters instance with the success and error callbacks removed.
        #
        _get_params: (params) ->
            result = {}
            for k, v of params
                if k != 'success' and k != 'error'
                    result[k] = v
            result

        _fetch: (instance, params) ->
            if instance
                @block()
                local_params = @_get_params params
                local_params.success = (model, response, options) =>
                    try
                        if params.success
                            # Invoke the callers success function.
                            params.success model, response, options
                    catch e
                        utils.display_error("Error processing fetched data: #{e}")
                    finally
                        @unblock()
                local_params.error = (model, response, options) =>
                    try
                        if params.error
                            # Invoke the callers error function.
                            params.error model, response, options
                    catch e
                        utils.display_error "Error while fetching data: #{e}"
                    finally
                        @unblock()
                instance.fetch local_params

        fetchModel: (params) ->
            @_fetch(@model, params)

        fetchCollection: (params) ->
            @_fetch(@collection, params)

        fetch: (params) ->
            if @model
                @fetchModel(params)
            else if @collection
                @fetchCollection(params)

    )
