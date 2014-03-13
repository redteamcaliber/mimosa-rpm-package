define (require) ->

    ###
        Collapse elements tagged with the collapsable or collapsable-header classes.
    ###
    collapse = (el) ->
        jq_el = $(el)

        if jq_el.hasClass('collapsable-header')
            new UAC.CollapsableContentView {
                el: '#' + jq_el.attr('id'),
                title: jq_el.attr('collapsable-title')
            }

        for collapsable in jq_el.find('.collapsable-header')
            new UAC.CollapsableContentView {
                el: collapsable,
                title: $(collapsable).attr('collapsable-title')
            }

        if jq_el.hasClass('collapsable')
            new UAC.CollapsableContentView {
                el: '#' + jq_el.attr('id'),
                title: jq_el.attr('collapsable-title'),
                display_toggle: false
            }

        for collapsable in jq_el.find('.collapsable')
            new UAC.CollapsableContentView {
                el: collapsable,
                title: $(collapsable).attr('collapsable-title'),
                display_toggle: false
            }


    result = require 'uac/common/utils'
    result.collapse = collapse

    result.Model = require 'uac/common/Model'
    result.Collection = require 'uac/common/Collection'
    result.View = require 'uac/common/View'

    result.SelectView = require 'uac/common/SelectView'
    #result.TableView = require 'uac/common/TableView'
    result.TableViewControls = require 'uac/common/TableViewControls'
    result.CollapsableContentView = require 'uac/common/CollapsableContentView'

    result