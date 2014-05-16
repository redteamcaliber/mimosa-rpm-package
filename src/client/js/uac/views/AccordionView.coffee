define (require) ->

    Marionette = require 'marionette'

    templates = require 'uac/ejs/templates'


    class AccordionItem extends Marionette.ItemView
        template: templates['accordion-item.ejs']
        tagName: 'div'
        className: 'panel panel-default'

    class AccordionView extends Marionette.CompositeView
        template: templates['accordion.ejs']
        itemView: AccordionItem

    AccordionView