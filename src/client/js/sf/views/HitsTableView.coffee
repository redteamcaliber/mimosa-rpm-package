define (require) ->
    TableView = require 'uac/views/TableView'
    CollapsableContentView = require 'uac/views/CollapsableContentView'


    #
    # Hits table view.
    #
    class HitsTableView extends TableView
        initialize: (options) ->
            super options

            @hits_collapsable = new CollapsableContentView
                el: @el

            @options.sAjaxSource = '/sf/api/hits'
            @options.sAjaxDataProp = 'results'
            @options.bServerSide = true

            @options.oLanguage =
                sEmptyTable: 'No hits were found'

            @options.aoColumns = [{
                sTitle: 'uuid',
                mData: 'uuid',
                bVisible: false,
                bSortable: false
            }, {
                sTitle: 'Created',
                mData: 'created',
                bVisible: true,
                bSortable: true,
                sClass: 'nowrap'
            }, {
                sTitle: 'am_cert_hash',
                mData: 'am_cert_hash',
                bVisible: false,
                bSortable: false
            }, {
                sTitle: 'rowitem_type',
                mData: 'rowitem_type',
                bVisible: false,
                bSortable: false
            }, {
                sTitle: 'Tag',
                mData: 'tagname',
                bSortable: true
            }, {
                sTitle: 'Summary',
                mData: 'summary1',
                bSortable: true,
                sClass: 'wrap'
            }, {
                sTitle: 'Summary2',
                mData: 'summary2',
                bSortable: true,
                sClass: 'wrap'
            }, {
                sTitle: "MD5",
                mData: "md5sum",
                bSortable: true,
                sClass: 'nowrap'
            }]

            @options.aaSorting = [
                [1, 'desc']
            ]

            @options.aoColumnDefs = [
                @date_formatter(1)
            ]

            @listenTo @, 'load', ->
                # Create the CSV link in the table header.

                # The url for the link.
                url = '/sf/api/hits?format=csv'
                if @params
                    url += '&' + $.param @params

                # The download file for the link.
                file = 'hits-' + moment().format('YYYY-MM-DD-HH:mm:ss') + '.csv'
                # The link.
                html = _.sprintf('<div class="pull-right" style="margin-bottom: 10px"><a download="%s" href="%s">Export to CSV</a></div>', file, url)
                # Add the link the table header.
                @$el.parent().find('.uac-tableheader').append(html)


                # Select the first row.
                @select_row(0)

            @listenTo @, 'click', (row, ev) =>
                position = @get_absolute_index(ev.currentTarget)

                if position isnt undefined
                    title = _.sprintf('<i class="fa fa-list"></i> Hits (%s of %s)', position + 1, @get_total_rows())
                else
                    title = _.sprintf('<i class="fa fa-list"></i> Hits (%s)', @get_total_rows())

                # Update the title with the count of the rows.
                @hits_collapsable.set('title', title)
            @listenTo @, 'empty', =>
                title = _.sprintf('<i class="fa fa-list"></i> Hits (%s)', '0')
                @hits_collapsable.set('title', title)

            # Add the tableheader div to the table.
            @options.sDom = '<"uac-tableheader"l>tip'
            @options.iDisplayLength = 10


    return HitsTableView