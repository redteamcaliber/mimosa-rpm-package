define (require) ->
    Marionette = require 'marionette'

    vent = require 'uac/common/vent'
    resources = require 'uac/common/resources'
    SelectView = require('uac/views/SelectView')
    TagCollection = require('sf/models/TagCollection')

    templates = require 'sf/ejs/templates'
    StrikeFinderEvents = require 'sf/common/StrikeFinderEvents'
    HitsView = require('sf/views/HitsView')

    class HitsByTagView extends Marionette.Layout
        template: templates['hits-by-tag.ejs']
        regions:
            tag_select_region: '#tag-select-region'

        onShow: ->
            # Get the list of tags without not reviewed.
            @tags = new TagCollection(_.reject(resources.tags, (item) -> item.id == 'notreviewed'))
            @select_tag_view = new SelectView
                collection: @tags
                id_field: "id"
                value_field: "title"
                selected: 'investigating'
                select_options:
                    width: "200px"
            @listenTo @select_tag_view, 'change', (value) =>
                vent.trigger StrikeFinderEvents.SF_TAG_SELECT,
                    tagname: value
            @tag_select_region.show @select_tag_view