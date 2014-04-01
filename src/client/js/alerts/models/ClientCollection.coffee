define (require) ->
    Backbone = require 'backbone'
    ClientModel = require 'alerts/models/ClientModel'

    ###
        Client collection class.
    ###
    class ClientCollection extends Backbone.Collection
        model: ClientModel
        url: '/alerts/api/clients'

    ClientCollection