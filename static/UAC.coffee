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

    result.Model = require 'uac/components/Model'
    result.Collection = require 'uac/components/Collection'
    result.View = require 'uac/components/View'

    result.SelectView = require 'uac/components/SelectView'
    #result.TableView = require 'uac/components/TableView'
    result.TableViewControls = require 'uac/components/TableViewControls'
    result.CollapsableContentView = require 'uac/components/CollapsableContentView'

    result