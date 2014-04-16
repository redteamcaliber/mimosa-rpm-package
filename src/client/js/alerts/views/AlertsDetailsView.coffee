define (require) ->
    Backbone = require 'backbone'
    Marionette = require 'marionette'

    utils = require 'uac/common/utils'
    vent = require 'uac/common/vent'
    PropertyView = require 'uac/views/PropertyView'
    ContainerView = require 'uac/views/ContainerView'
    TreeView = require 'uac/views/TreeView'
    TableView = require 'uac/views/TableView'
    TableViewControls = require 'uac/views/TableViewControls'

    Events = require 'alerts/common/Events'
    templates = require 'alerts/ejs/templates'


    class AlertRawMenu extends Marionette.ItemView
        tagName: 'span'

        events:
            'click button': 'on_click'

        template: ->
            return '<button type="button" class="btn btn-link"><i class="fa fa-code"></i> Raw</button>'

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

            (
                alert: alert
            )

        #
        # Parse the service data.
        #
        parse_service: (service) ->
            result = {}
            # The individual requests within the service.
            result.requests = []
            # The request metadata.
            result.server = "#{service.address}:#{service.port}"
            result.location = service.location
            result.protocol = if service.protocol then service.protocol.toUpperCase() else null

            if service.channel
                # Split the data into individual requests.
                requests = service.channel.split '::~~::~~'
                for request in requests
                    if request.trim() != ''
                        result.requests.push(request.split '::~~')
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

    class OSChangeView extends ContainerView
        template: templates['os-changes.ejs']

        skipped_sections:
            'analysis': ''
            'end-of-report': ''
            'id': ''
            'malicious-alert': ''
            'os-inactivity-send-keys': ''
            'osinfo': ''
            'version': ''

        events:
            'click .view-timeline-button': 'on_click'

        regions:
            malicious_alerts_region: '.malicious-alerts-region'

        serializeData: ->
            os_changes = @model.attributes.content.explanation['os-changes']

            if os_changes and os_changes.length > 0

                reports = []

                for report_index of os_changes
                    report = os_changes[report_index]

                    # Make sure that malicious alerts is a list.
                    malicious_alerts = report['malicious-alert']
                    if malicious_alerts and not Array.isArray malicious_alerts
                        malicious_alerts = [malicious_alerts]
                    reports.push
                        analysis_file_type: report.analysis.ftype
                        analysis_mode: report.analysis.mode
                        analysis_version: report.analysis.version
                        malicious_alerts: malicious_alerts
                        os_name: report.os.name
                        os_info: report.osinfo
                        os_sp: report.os.sp
                        os_version: report.os.version
                        version: report.analysis.version

            (
                alert: (
                    reports: reports
                )
            )

        on_click: (ev) =>
            report_index = $(ev.currentTarget).data('report')
            os_changes = @model.attributes.content.explanation['os-changes']
            report = os_changes[report_index]

            timeline = []
            for section, values of report
                if Array.isArray(values) and (not (section of @skipped_sections))
                    for change in values
                        change.type = section
                        if not change.timestamp
                            change.timestamp = ''
                        timeline.push change
                else if not (section of @skipped_sections)
                    console.warn "Section: #{section} is not of type Array."
                    values.type = section
                    if not values.timestamp
                        values.timestamp = ''
                    timeline.push values

            vent.trigger Events.ALERTS_TIMELINE, timeline


    class AlertsDetailsView extends ContainerView
        template: templates['details-layout.ejs']

        regions:
            artifacts_region: '.artifacts-region'
            header_region: '.header-region'
            interface_region: '.interface-region'
            message_region: '.message-region'
            os_changes_region: '.os-changes-region'
            request_region: '.request-region'
            raw_region: '.raw-region'
            signatures_region: '.signatures-region'
            table_controls_region: '.controls-region'

        initialize: ->
            @addChild @table_controls_region, new TableViewControls
                table_name: 'alerts_table'
            @addChild @raw_region, AlertRawMenu
            @addChild @header_region, AlertHeaderView
            @addChild @signatures_region, AlertSignaturesView
            @addChild @interface_region, AlertInterfaceView
            @addChild @request_region, AlertRequestView
            @addChild @artifacts_region, AlertsArtifactsView
            @addChild @message_region, AlertMessageView
            @addChild @os_changes_region, OSChangeView


    return AlertsDetailsView