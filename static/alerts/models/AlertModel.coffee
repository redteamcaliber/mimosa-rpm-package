define (require) ->
    Backbone = require 'backbone'

    #
    # Alert model class.
    #
    class AlertModel extends Backbone.Model
        idAttribute: 'uuid'

    AlertModel