define (require) ->
    Marionette = require 'marionette'

    vent = require 'uac/common/vent'
    StrikeFinderEvents = require 'sf/common/StrikeFinderEvents'
    uac_utils = require 'uac/common/utils'

    SetTagModel = require 'sf/models/SetTagModel'
    templates = require 'sf/ejs/templates'

    #
    # View for rendering a selectable list of tags values.
    #
    class TagView extends Marionette.ItemView
        className: 'btn-group'
        template: templates['tags.ejs']

        initialize: (options) ->
            this.options = options

        events: {
            'click .dropdown-menu > li > a': 'on_click'
        },

        onRender: ->
            disabled = @options.disabled is true
            tagname = @model.get('tagname')
            selected_value = undefined

            # Get the drop down menu.
            menu = @$('.dropdown-menu')
            # Remove any child elements.
            menu.empty()

            @collection.forEach (item) ->
                item_name = item.get('name')
                item_title = item.get('title')

                if tagname && tagname == item_name
                    # Save off the value to display.
                    selected_value = item_title

                    if not disabled
                        menu.append(_.sprintf('<li><a name="%s" title="%s">%s &#10004;</a></li>', item_name, item_name, item_title))

                else if not disabled
                    menu.append(_.sprintf('<li><a name="%s" title="%s">%s</a></li>', item_name, item_name, item_title))

            if selected_value
               @$('.selected').html(selected_value)

            if disabled
                # Disable the tag component.
                @$el.find('button').prop('disabled', true)

        on_click: (ev) =>
            uac_utils.block()

            tagname = $(ev.currentTarget).attr('name')
            uuid = @model.get('uuid')

            console.log(_.sprintf('Setting tag: %s on rowitem_uuid: %s', tagname, uuid))

            tag_model = new SetTagModel
                rowitem_uuid: uuid,
                tagname: tagname

            tag_model.save {},
                    async: false,
                    success: =>
                        try
                            @trigger('create', uuid, tagname)
                            vent.trigger(StrikeFinderEvents.SF_TAG_CREATE, {
                                rowitem_uuid: uuid,
                                tagname: tagname
                            });
                            console.log(_.sprintf('Applied tag: %s to rowitem_uuid: %s', tagname, uuid))
                            uac_utils.display_success('Successfully applied tag: ' + tagname)
                        finally
                            uac_utils.unblock()
                    error: =>
                        uac_utils.unblock()
                        uac_utils.display_error('Error while applying tag.')


    return TagView