
define (require) ->
    Backbone = require 'backbone'
    Marionette = require 'marionette'

    utils = require 'uac/common/utils'
    vent = require 'uac/common/vent'
    PropertyView = require 'uac/views/PropertyView'
    TreeView = require 'uac/views/TreeView'

    Events = require 'alerts/common/Events'
    templates = require 'alerts/ejs/templates'

    class AlertRawMenu extends Marionette.ItemView
        tagName: 'span'
        template: ->
            return '<button type="button" class="btn btn-link"><i class="fa fa-code"></i> Raw</button>'

        onRender: ->
            @delegateEvents
                'click button': 'on_click'
            return

        on_click: =>
            vent.trigger Events.ALERTS_RAW_ALERT, @model.toJSON()
            false

    #
    # View to display the alert header data.
    #
    class AlertHeaderView extends Marionette.Layout
        template: templates['alerts-header.ejs']
        regions:
            controls_region: '.controls_region'
            raw_region: '.raw-region'

        serializeData: ->
            alert = @model.get 'alert'
            content = @model.get 'content'
            data = {}

            # Alert data.
            data.type = alert.type
            data.occurred = utils.format_date_string(alert.occurred)
            data.updated = utils.format_date_string(alert.updated)
            data.client = alert.device.client.name
            data.priority = alert.priority
            data.severity = content.severity
            data.device = alert.device.name
            data.device_type = alert.device.type
            data.analysis = if alert.analysis_type then alert.analysis_type[0].toUpperCase() + alert.analysis_type[1..-1].toLowerCase()

            # Source and destination.
            if alert.type == 'malware-callback'
                data.src = "#{alert.src}:#{content.src.port}"
                data.dst = "#{alert.dst}:#{content.dst.port}"
            else
                data.src = alert.src
                data.dst = alert.dst
            {
            alert: data
            }

    #
    # View to display the alerts signatures.
    #
    class AlertSignaturesView extends Marionette.ItemView
        template: templates['alert-signatures.ejs']
        serializeData: ->
            data = {}

            signatures = []
            for signature in @model.get('content').explanation['malware-detected'].malware
                signatures.push @process_signature(signature)
            data.signature_map = _.groupBy _.clone(signatures), 'Name'

            data.unique_signatures = []
            for signature, index in Object.keys(data.signature_map)
                data.unique_signatures.push
                    name: signature
                    active: if index is 0 then 'active' else ''
            data

        process_signature: (signature) ->
            result = {}

            if signature.name then result.Name = signature.name

            if signature.stype
                types = signature.stype.split ';'
                result.Type = types.join ','

            if signature.original then result['Original Signature'] = signature.original
            if signature.application then result['Application'] = signature.application
            if signature.type then result['File Type'] = signature.type
            if signature.md5sum then result.MD5 = signature.md5sum
            if signature['downloaded-at'] then result['Downloaded At'] = signature['downloaded-at']
            if signature['executed-at'] then result['Executed At'] = signature['executed-at']
            result

    class AlertInterfaceView extends PropertyView
        get_title: ->
            '<i class="fa fa-globe"></i> Interface'
        get_properties: ->
            intf = @model.attributes.content.interface
            if intf
                Name: if intf.interface then intf.interface else undefined
                Label: if intf.label then intf.label else undefined
                Mode: if intf.mode then intf.mode else undefined
            else
                undefined

    class AlertRequestView extends Marionette.ItemView
        template: templates['alert-request.ejs']

        serializeData: ->
            alert = {
                services: []
            }
            content = @model.get 'content'
            if content.explanation['cnc-services']
                for service in content.explanation['cnc-services']['cnc-service']
                    alert.services.push @parse_service(service)

            {
            alert: alert
            }

        parse_service: (service) ->
            result = {}
            result.server = "#{service.address}:#{service.port}"
            result.location = service.location
            result.protocol = if service.protocol then service.protocol.toUpperCase() else null

            if service.channel
                parts = service.channel.split '::~~'
                result.request = parts[0]
                result.headers = []
                for index in [1..parts.length] when index < parts.length
                    part = parts[index]
                    if part and part.trim() != ''
                        result.headers.push parts[index]
            result

    #
    # Display the smtp-message field of the alert.
    #
    class AlertMessageView extends PropertyView
        get_title: ->
            '<i class="fa fa-envelope-o"></i> SMTP Message'

        get_properties: ->
            message = @model.attributes.content['smtp-message']
            if message
                ID: if message.id then message.id else undefined
                Subject: if message.subject then message.subject else undefined
                Date: if message.date then utils.format_date_string(message.date) else undefined
                'Last Malware': if message['last-malware'] then message['last-malware'] else undefined
                Protocol: if message.protocol then message.protocol else undefined
            else
                undefined

    class AlertsArtifactsView extends Marionette.ItemView
        template: templates['alert-artifacts.ejs']
        serializeData: ->
            alert:
                artifacts: @model.get('alert').artifacts

    class OSChangeView extends TreeView


    class ContainerView extends Marionette.Layout
        container: new Backbone.ChildViewContainer()

        #
        # Add a child view to be managed.
        #
        # Params:
        #   region - the region to bind the view to.
        #   view - the view to display at the region.
        #
        addChild: (region, view) ->
            if view instanceof Function
                view_instance = new view
                    model: @model
            else
                view_instance = view
            @container.add view_instance, region.el
            return

        onShow: ->
            # If there is a view associated with a region then show it.
            for region_name, el of @regions
                # Retrieve the region object.
                region = @regionManager.get(region_name)
                # Retrieve the associated view from the container.
                view = @container.findByCustom(region.el)
                if view
                    # Show the view to the region.
                    console.debug "Showing view to region: #{region.el}"
                    region.show view
                else
                    # There is not a view for this region.
                    console.debug "Warning: No view found for region: #{region.el}"

        close: ->
            # Close the child views.
            console.debug 'ContainerView::Closing child views...'
            @container.forEach (child) ->
                child.close()
            super
            return


    class AlertsDetailsView extends ContainerView
        template: templates['details-layout.ejs']
        templateHelpers:
            raw_alert: =>
                return ''
            format_date: (date) ->
                utils.format_date_string date
            to_json: (o) ->
                if o
                    JSON.stringify o, null, 4
                else
                    JSON.stringify {}, null, 4
        regions:
            artifacts_region: '.artifacts-region'
            header_region: '.header-region'
            interface_region: '.interface-region'
            message_region: '.message-region'
            os_change_region: '.os-region'
            request_region: '.request-region'
            raw_alert_region: '#raw-alert'
            raw_region: '.raw-region'
            signatures_region: '.signatures-region'
            table_controls_region: '#table-controls'

        initialize: ->
            super

            # Validate regions.
            for region in @regions
                if $(region).length == 0
                    throw "Exception, invalid region: #{region}"

            @addChild @raw_region, AlertRawMenu
            @addChild @header_region, AlertHeaderView
            @addChild @signatures_region, AlertSignaturesView
            @addChild @interface_region, AlertInterfaceView
            @addChild @request_region, AlertRequestView
            @addChild @artifacts_region, AlertsArtifactsView
            @addChild @message_region, AlertMessageView
            @addChild @os_change_region, OSChangeView


    return AlertsDetailsView