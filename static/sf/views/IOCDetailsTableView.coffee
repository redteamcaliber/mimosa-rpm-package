define (require) ->
    $ = require("jquery")
    Backbone = require("backbone")
    View = require("uac/views/View")
    TableView = require("uac/views/TableView")
    ExpressionView = require("sf/views/ExpressionView")

    ###
    IOC details table view.
    ###
    IOCDetailsTableView = TableView.extend(
        initialize: ->
            view = this
            view.options.aoColumns = [
                {
                    sTitle: "exp_key"
                    mData: "exp_key"
                    bVisible: false
                }
                {
                    sTitle: "Expression"
                    mData: "exp_key"
                    sWidth: "50%"
                }
                {
                    sTitle: "Supp"
                    mData: "suppressed"
                    sWidth: "10%"
                }
                {
                    sTitle: "Open"
                    mData: "open"
                    sWidth: "10%"
                }
                {
                    sTitle: "In Progress"
                    mData: "inprogress"
                    sWidth: "10%"
                }
                {
                    sTitle: "Closed"
                    mData: "closed"
                    sWidth: "10%"
                }
            ]
            view.options.aoColumnDefs = [
                mRender: (data, type, row) ->
                    # Display <rowitem_type> (<exp_key>)
                    return "#{row.rowitem_type} (#{data})"
                aTargets: [1]
            ]
            view.options.sDom = "t"
            view.options.iDisplayLength = -1
            view.expression_views = []
            view.listenTo view, "row:created", (row, data) ->
                expression_view = new ExpressionView(
                    el: $(row)
                    model: new Backbone.Model(data)
                )
                expression_view.render()
                view.expression_views.push expression_view
                return

            return

        close: ->
            @stopListening()
            _.each @expression_views, (ev) ->
                ev.close()
                return

            return
    )
    IOCDetailsTableView