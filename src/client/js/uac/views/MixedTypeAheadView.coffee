define (require)->
    Marionette = require 'marionette'
    Evented = require 'uac/common/mixins/Evented'
    utils = require 'uac/common/utils'
    templates = require 'uac/ejs/templates'
    View = require 'uac/views/View'
    typeahead = require 'typeahead'


    class MixedTypeAheadView extends View
        template: templates['mixedtypeahead.ejs']
        initialize: =>
            @render()
        render: ->
            isAHash = (settings)->
                /^[0-9a-fA-F]{32}$/.test(settings.url.split("/").pop())

            ###
            generic response filter for typeahead bloodhounds takes 3 inputs
            @param errorMessage: the message to display if no results are detected
            @param inputTest: the test to determine if the input is applicable to this bloodhound (if you're serching
                              for hashes you don't care that no hosts were returned)
            @param responseTest: the test to determine if the server returned data that you want to display to the user
                                  for example your server may always return a Response object, but it may have a 'found'
                                  attribute that can be true or false
            ###
            responseFilterProcessor = (errorMessage, inputTest, responseTest)=>
                _.bind (parsedResponse)->
                    if ((responseTest && !responseTest(parsedResponse)) || !responseTest)
                        if ((inputTest && inputTest.test(@$el.val())) || !inputTest)
                            this.display_info errorMessage
                            return []
                    unless _.isArray parsedResponse then [parsedResponse] else parsedResponse
                , _this

            hostOrIp = new Bloodhound
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace 'value'
                queryTokenizer: Bloodhound.tokenizers.whitespace
                remote:
                    url: '/sf/api/hosts?hosts=%QUERY'
                    rateLimitWait: 1000
                    ajax:
                        beforeSend: (jqXhr, settings)=>
                            #if its a hash abort the query
                            if  isAHash settings then jqXhr.abort() else @block()
                        complete: (response)->
                            utils.unblock()
                    filter: responseFilterProcessor "No Host or IPs Found", /^.{0,31}$/, (response)->
                        (_.isArray(response) && response.length > 0)


            md5Hashes = new Bloodhound
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace 'value'
                queryTokenizer: Bloodhound.tokenizers.whitespace
                remote:
                    url: '/api/md5/%QUERY'
                    rateLimitWait: 1000
                    ajax:
                        beforeSend: (jqXhr, settings)=>
                            #if its a hash complete the query
                            unless isAHash settings then jqXhr.abort() else @block()
                        complete: (response)->
                            utils.unblock()
                    filter: responseFilterProcessor "No MD5 Hashes Found", /^[0-9a-fA-F]{32}$/, (response)->
                        response.vt.found

            hostOrIp.initialize()
            md5Hashes.initialize()

            typeahead = @$el.typeahead { minLength: 3 },
                {
                    name: 'hosts'
                    displayKey: 'hostname',
                    source: hostOrIp.ttAdapter()
                    templates:
                        empty: '<h5>No matching data found.</h5>'
                        suggestion: templates['host-condensed.ejs']
                },
                {
                    name: 'hashes'
                    displayKey: (value)-> if value then value.vt.md5
                    source: md5Hashes.ttAdapter()
                }

            $('.tt-dropdown-menu').addClass('well');

            typeahead.on 'typeahead:cursorchanged', ->
                $('.tt-cursor').addClass('uac-theme-primary-background').siblings().removeClass('uac-theme-primary-background')

            $('.tt-dropdown-menu').on 'mouseover', ->
                $('.tt-cursor').addClass('uac-theme-primary-background').siblings().removeClass('uac-theme-primary-background')

            typeahead.on 'typeahead:selected', (evt, data)->
                if data.hasOwnProperty("hash")
                    window.location = _.sprintf('/sf/host/%s/', data.hash)
                else
                    window.location = _.sprintf('/md5/%s/', data.vt.md5)



