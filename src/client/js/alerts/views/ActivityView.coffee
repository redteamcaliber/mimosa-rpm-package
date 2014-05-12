define (require) ->

    Marionette = require 'marionette'
    moment = require 'moment'
    marked = require 'marked'

    utils = require 'uac/common/utils'
    resources = require 'uac/common/resources'
    EditorView = require 'uac/views/EditorView'
    templates = require 'alerts/ejs/templates'

    ActivityModel = require 'alerts/models/ActivityModel'
    ActivityCollection = require 'alerts/models/ActivityCollection'


    class ActivityDetailView extends Marionette.ItemView
        tagName: 'li'
        className: 'list-group-item'
        template: templates['activity.ejs']
        templateHelpers:
            marked: marked
            format_date: (date) ->
                if date
                    now = moment()
                    before = moment(date)
                    days = now.diff(before, 'days')
                    if days == 0
                        "#{before.format 'YYYY-MM-DD'} (today)"
                    else if days == 1
                        "#{before.format 'YYYY-MM-DD'} (#{days} day ago)"
                    else
                        "#{before.format 'YYYY-MM-DD'} (#{days} days ago)"
                else
                    ''
            tag: (key) ->
                v = resources[key]
                if v
                    v.title
                else
                    key

        serializeData: ->
            model = @model.toJSON()

            if model.data
                model.data = JSON.parse model.data
            item: model

        onRender: ->
            @$el.css 'background-color', 'inherit'

    class ActivityListView extends Marionette.CollectionView
        tagName: 'ul'
        className: 'list-group'
        itemView: ActivityDetailView

    #
    # UAC view to display activities.
    #
    class ActivityView extends Marionette.Layout
        template: templates['activity-layout.ejs']

        events:
            'click .add-comment': 'on_add_comment'

        regions:
            editor_region: '.editor_region'
            activity_list_region: '.activity-list-region'

        initialize: (options) ->
            super options

            if options and options.alert_uuid
                @alert_uuid = @options.alert_uuid
            else
                console.warn '"alert_uuid" not specified.'

        onRender: ->
            @activities = new ActivityCollection()
            @activities.alert_uuid = @alert_uuid

            utils.block_element @$el

            @activities.fetch
                success: =>
                    utils.unblock @$el
                    @activity_list_region.show new ActivityListView
                        collection: @activities
                error: (model, response) =>
                    utils.unblock @$el
                    utils.display_response_error 'Error while loading activities.', response

        onDomRefresh: ->
            @editor_region.show new EditorView
                mode: 'ace/mode/markdown'
                height: '200px'

        on_add_comment: ->
            comment = @editor_region.currentView.value()

            if comment
                comment = _.trim comment
                # Create a new comment.
                activity = new ActivityModel
                    alert_uuid: @alert_uuid
                    comment: comment
                if activity.isValid()
                    utils.block()
                    activity.save {},
                        success: =>
                            utils.unblock()
                            utils.display_success 'Successfully added new comment.'
                            @render()
                        error:(model, response) =>
                            utils.display_response_error('Error saving comment.', response)
                            utils.unblock()
                else
                    # Error
                    errors = activity.validationError
                    for error in errors
                        utils.display_error error

    ActivityView