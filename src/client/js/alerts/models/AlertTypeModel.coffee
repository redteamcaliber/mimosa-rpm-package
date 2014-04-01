define (require) ->
    Backbone = require 'backbone'

    ###
        Alert type model class.
    ###
    class AlertTypeModel extends Backbone.Model
        #
        # The response only contains values.
        #
        parse: (data, options) ->
            return {id: data}

    AlertTypeModel