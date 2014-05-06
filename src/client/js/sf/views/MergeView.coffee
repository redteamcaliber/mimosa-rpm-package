define (require) ->

    Marionette = require 'marionette'

    utils = require 'uac/common/utils'
    vent = require 'uac/common/vent'

    templates = require 'sf/ejs/templates'
    Events = require 'sf/common/Events'


    #
    # View for displaying the merge button and handling the related actions.
    #
    class MergeView extends Marionette.ItemView
        tagName: 'button'
        className: 'btn btn-link'
        template: templates['merge.ejs']

        events:
            'click': 'on_click'

        initialize: ->
            @$el.hide()

        onRender: ->
            current_uuid = @model.get('uuid')
            identical_hits = @model.get('identical_hits')

            # Enable the merge option when there are more than one identical hits and the currently selected identity
            # is not the target of the merge operation.
            if identical_hits and identical_hits.length > 1 and current_uuid != identical_hits[0].uuid
                @$el.prop('disabled', false)
                @$el.show()
            else
                @$el.prop('disabled', true)
                @$el.hide()

        #
        # Handle the click of the merge button.
        #
        on_click: ->
            utils.block()

            # Merge the current identity into the current.
            uuid = @model.get('uuid')
            merge_model = new Backbone.Model()
            merge_model.url = '/sf/api/hits/' + uuid + '/merge'
            merge_model.save {},
                success: (model, response) =>
                    try
                        console.log 'Merged ' + uuid + ' into ' + response.uuid
                        utils.display_success('Successfully merged identities.')

                        # Notify that a merge has taken place.
                        @trigger('merge', uuid, response.uuid)
                        vent.trigger Events.SF_MERGE, uuid, response.uuid
                    finally
                       utils.unblock()
                error: (model, response) ->
                    # Error.
                    utils.unblock()
                    utils.display_response_error('Error while performing merge.', response)


    return MergeView