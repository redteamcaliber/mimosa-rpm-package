define (require) ->

    Backbone = require 'backbone'
    AlertTypeModel = require 'alerts/models/AlertTypeModel'

    ###
        Alert type collection class.
    ###
    class AlertTypeCollection extends Backbone.Collection
        model: AlertTypeModel
        url: '/alerts/api/types'

    AlertTypeCollection