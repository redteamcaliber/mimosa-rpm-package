define (require) ->

    Marionette = require 'marionette'
    ChildViewContainer = require 'backbone.babysitter'

    utils = require 'uac/common/utils'
    vent = require 'uac/common/vent'
    CollapsableView = require 'uac/views/CollapsableView'

    Events = require 'alerts/common/Events'
    RawAlertView = require 'alerts/views/RawAlertView'
    templates = require 'alerts/ejs/templates'

    class AlertRawMenu extends Marionette.ItemView
        tagName: 'span'
        template: ->
            return '<button type="button" class="btn btn-link"><i class="fa fa-code"></i> Raw</button>'
        events:
            'click button': 'on_click'
        on_click: =>
            vent.trigger Events.ALERTS_RAW_ALERT, @model.toJSON()
            return false

    #
    # View to display the alert header data.
    #
    class AlertHeaderView extends Marionette.Layout
        template: templates['alerts-header.ejs']
        initialize: ->
            @container = new ChildViewContainer()
        regions:
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

        onShow: ->
            raw_menu_view = new AlertRawMenu
                model: @model
            @raw_region.show raw_menu_view
            @container.add raw_menu_view

        close: ->
            @container.forEach (child) ->
                child.close()
            super

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
            data.signature_map = _.groupBy _.clone(signatures), 'name'

            data.unique_signatures = []
            for signature, index in Object.keys(data.signature_map)
                data.unique_signatures.push
                    name: signature
                    active: if index is 0 then 'active' else ''
            data

        process_signature: (signature) ->
            result = _.clone(signature)
            result.active = ''
            if result.stype
                types = signature.stype.split ';'
            else
                types = [signature.stype]
            result.stype = types.join ', '
            result


    class AlertInterfaceView extends Marionette.ItemView
        template: templates['alert-interface.ejs']

        serializeData: ->
            alert = {}
            if @model.get('content').interface
                alert.interface = @model.get('content').interface
            else
                alert.inteface = null
            {
                alert: alert
            }

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

            parts = service.channel.split '::~~'
            result.request = parts[0]
            result.headers = []
            for index in [1..parts.length] when index < parts.length
                part = parts[index]
                if part and part.trim() != ''
                    result.headers.push parts[index]
            result

    class AlertsArtifactsView extends Marionette.ItemView
        template: templates['alert-artifacts.ejs']
        serializeData: ->
            {
                alert: {
                    artifacts: @model.get('alert').artifacts
                }
            }

    class AlertsDetailsView extends Marionette.Layout
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
            table_controls_region: '#table-controls'
            header_region: '.header-region'
            signatures_region: '.signatures-region'
            interface_region: '.interface-region'
            request_region: '.request-region'
            artifacts_region: '.artifacts-region'
            raw_alert_region: '#raw-alert'

        initialize: (options) ->
            @container = new ChildViewContainer()

            @views = [
                {
                    cls: AlertHeaderView
                    region: @header_region
                }
                {
                    cls: AlertSignaturesView
                    region: @signatures_region
                }
                {
                    cls: AlertInterfaceView
                    region: @interface_region
                }
                {
                    cls: AlertRequestView
                    region: @request_region
                }
                {
                    cls: AlertsArtifactsView
                    region: @artifacts_region
                }
            ]

            for view in @views
                v = new view.cls
                    model: @model
                @container.add v, view.region.el

            raw_alert_collapsable = new CollapsableView
                title: '<i class="fa fa-code"></i> Raw Alert'
                collapsed: true
            @container.add raw_alert_collapsable, 'raw_alert_collapsable'

            raw_alert_view = new RawAlertView
                model: @model
            @container.add raw_alert_view, 'raw_alert_view'

            return

        onShow: ->
            for view in @views
                v = @container.findByCustom(view.region.el)
                view.region.show v

            collapsable = @container.findByCustom 'raw_alert_collapsable'
            @raw_alert_region.show collapsable
            collapsable.append @container.findByCustom('raw_alert_view').render().el
            return

        close: ->
            @container.forEach (child) ->
                child.close()
            super
            return


    return AlertsDetailsView