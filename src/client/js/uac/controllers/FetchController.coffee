
define (require) ->

    Marionette = require 'marionette'

    utils = require 'uac/common/utils'

    #
    # Controller for fetching data and displaying a view on success while adding support for blocking and error handling.
    #
    class FetchController extends Marionette.Controller
        initialize: (options) ->
            if options
                if options.collection
                    @collection = options.collection
                if options.model
                    @model = options.model
                if options.region
                    @region = options.region
                if options.block_region
                    @block_region = options.block_region
                if options.view
                    @view = options.view
                if options.loading
                    @loading = options.loading

        #
        # Fetch the collection and show the view while adding blocking support and error handling.
        #
        fetch: (params) ->
            if params
                local_params = _.clone(params)
            else
                local_params = {}
            local_params.success = (model, response, options) =>
                try
                    # Attempt to show the view.
                    @_show()
                    if params
                        if params.success
                            params.success model, response, options
                        if params.done
                            params.done model, response, options
                finally
                    @_unblock()
                    @close()
            local_params.error = (model, response, options) =>
                try
                    if params
                        if params.error
                            params.error model, response, options
                        else
                            @_display_error 'Error while fetching data', e
                        if params.done
                            params.done model, response, options
                finally
                    @_unblock()
                    @close()

            if @collection
                data = @collection
            else if @model
                data = @model
            else
                console.warn 'Warning: No collection or model specified.'

            if data
                try
                    # Block the UI.
                    @_block()

                    # Fetch the data.
                    data.fetch local_params
                catch e
                    # Error
                    @_display_error 'Exception while fetching data', e
            else
                # Close the controller after fetching.
                @close()
        _block: ->
            if @block_region
                utils.block_element @block_region.el, @loading
            else if @region
                utils.block_element @region.el, @loading
            else
                utils.block()

        _unblock: ->
            if @block_region
                utils.unblock @block_region.el
            else if @region
                utils.unblock @region.el
            else
                utils.unblock()

        _show: ->
            if @view and not @region
                console.warn "Warning: A view was specified without specifying a region."
            else if @view and @region
                @region.show @view

        _display_error: (message, e) ->
            console.error "#{message}: #{e}"
            if e
                console.error e.stack
            utils.display_response_error "Error while fetching data: #{e}"


    FetchController