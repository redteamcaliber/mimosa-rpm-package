define (require) ->

    Marionette = require 'marionette'

    #
    # Base class for rendering and cleaning up a list of child views.
    #
    class ContainerView extends Marionette.Layout
        container: new Backbone.ChildViewContainer()

        #
        # Add a child view to be managed.
        #
        # Params:
        #   region - the region to bind the view to.
        #   view - the view to display at the region.
        #
        addChild: (region, view) ->
            if view instanceof Function
                view_instance = new view
                    model: @model
            else
                view_instance = view
            @container.add view_instance, region.el
            return

        onShow: ->
            # Validate regions.
            for region, el of @regions
                if $(el).length == 0
                    console.warn "Warning: Region is not present: {#{region}:#{el}}"

            # If there is a view associated with a region then show it.
            for region_name, el of @regions
                # Retrieve the region object.
                region = @regionManager.get(region_name)
                # Retrieve the associated view from the container.
                view = @container.findByCustom(region.el)
                if view
                    # Show the view to the region.
                    console.debug "Showing view to region: #{region.el}"
                    region.show view
                else
                    # There is not a view for this region.
                    console.debug "Warning: No view found for region: #{region.el}"

        #
        # Retrieve the underlying view container.
        #
        getContainer: ->
            return @container

        #
        # Retrieve a view by it's region.  Returns undefined if not found.
        #
        findByRegion: (region) ->
            if region
                return @container.findByCustom(region.el)
            else
                return undefined

        close: ->
            # Close the child views.
            console.debug 'ContainerView::Closing child views...'
            @container.forEach (child) ->
                child.close()
            super

            @trigger 'close'
            return


    ContainerView