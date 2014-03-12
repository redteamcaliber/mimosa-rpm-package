
define ['backbone'], (Backbone) ->

    ###
        Invoke a template.

        Params:
            template - the template name.
            context - the template context.
        Returns:
            The template result.
    ###
    template = (template, context) ->
#        if not Alerts.templates
#            # Error, templates does not exist.
#            throw 'Alerts.templates is not initialized.'
#        else if not template in Alerts.templates
#            # Error, template not found.
#            throw "Alert template: #{template} not found."
#        else
#            # Add the view helpers.
#            UAC.default_view_helpers(context)
#
#            # Return the template result.
#            Alerts.templates[template](context)

    return {
        template: template
    }
