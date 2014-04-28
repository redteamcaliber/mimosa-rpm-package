define (require)->
  Marionette = require 'marionette'
  Evented = require 'uac/common/mixins/Evented'
  utils = require 'uac/common/utils'
  templates = require 'uac/ejs/templates'
  View = require 'uac/views/View'
  typeahead = require 'typeahead'


  class MixedTypeAheadView extends View

    template: templates['mixedtypeahead.ejs']
    initialize: => @render()
    render: ->
      isAHash = (settings)-> /^[0-9a-fA-F]{32}$/.test(settings.url.split("/").pop())

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
            complete: (response)-> utils.unblock()


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
            complete: (response)-> utils.unblock()
          filter: (parsedResponse)-> [parsedResponse]

      hostOrIp.initialize()
      md5Hashes.initialize()

      typeahead = @$el.typeahead { minLength: 3 },
        {
          name: 'hosts'
          displayKey: 'hostname',
          source: hostOrIp.ttAdapter()
          templates:
            suggestion: templates['host-condensed.ejs']
        },
        {
        name: 'hashes'
        displayKey: (value)-> if value then value.vt.md5
        source: md5Hashes.ttAdapter()
        }



      $('.tt-dropdown-menu').addClass('well');

      typeahead.on 'typeahead:selected', (evt, data)->
        if data.hasOwnProperty("hash")
          window.location = _.sprintf('/sf/host/%s/', data.hash)
        else
          window.location = _.sprintf('/md5/%s/', data.vt.md5)



