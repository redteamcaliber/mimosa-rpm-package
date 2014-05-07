define (require) ->

    Marionette = require 'marionette'

    utils = require 'uac/common/utils'
    templates = require('sf/ejs/templates')

    #
    # View to display a link to the current hit.
    #
    class HitsLinkView extends Marionette.ItemView
        tagName: 'span',
        template: templates['hits-link.ejs'],

        onRender: ->
            data = @model.toJSON()

            port = if window.location.port then ":#{window.location.port}" else ''
            link = "#{window.location.protocol}//#{window.location.hostname}#{port}/sf/hits/identity/#{data.identity}"

            html = utils.run_template templates, 'link.ejs',
                link: link,
                label: 'Link to Hit'
                width: '550px'

            el = @$('a')
            el.popover(
                html: true
                trigger: 'click'
                content: html
            ).data('bs.popover').tip().addClass('link-popover').css
                width: 'auto'
                'max-width': '800px'

            el.on 'shown.bs.popover', =>
                $('.link-text').select()

        onBeforeClose: ->
            @$('a').popover('destroy')

    return HitsLinkView