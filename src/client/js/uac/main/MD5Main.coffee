define (require) ->
    _ = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    utils = require 'uac/common/utils'
    MD5ContentView = require 'uac/views/MD5ContentView'
    MD5Model = require 'uac/models/MD5Model'

    md5Model = new MD5Model
        id: UAC.hash

    md5View = new MD5ContentView
        model: md5Model

    md5Model.fetch
        success: ->
            $('#md5hashes').append md5View.render().el
        error: (model, response) ->
            utils.display_response_error('Error while retrieving MD5 data.', response)

return