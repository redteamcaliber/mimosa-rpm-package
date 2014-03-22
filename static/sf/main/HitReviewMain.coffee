define (require) ->
    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    CollapsableView = require 'uac/views/CollapsableView'
    ShoppingView = require 'sf/views/ShoppingView'

    # The element to append the shopping views to.
    shopping_el = $('#shopping-div')

    # Create a collapsable to wrap the shopping view.
    shopping_collapsable = new CollapsableView()
    shopping_el.append shopping_collapsable.render().el

    #
    # Function for setting the collapsable title.
    #
    set_title = (items) ->
        title = '<i class="fa fa-search"></i> IOC Selection'
        if items && items.length > 0
            for item in items
                title += " &nbsp; / &nbsp; #{item}"
        shopping_collapsable.set_title title
        if items and items.length > 0
            shopping_collapsable.collapse()

    # Create a shopping view and render it.
    shopping_view = new ShoppingView(
        standalone: false
    )
    shopping_collapsable.append(shopping_view.el)
    shopping_view.render()

    # Update the collapsable title when the shopping view emits events.
    shopping_view.listenTo shopping_view, 'render:hits', (items) ->
        set_title(items)

    # Display the default title.
    set_title()

    return