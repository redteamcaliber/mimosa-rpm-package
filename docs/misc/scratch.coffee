
    type        TEXT        -- The type of actvity event.
    created     TIMESTAMP   -- When the activity occurred.
    data        TEXT        -- JSON data.


(
    type: 'comment'
    data:
        text: 'This is a test!'

)


define (require) ->

    Backbone = require 'backbone'
    Marionette = require 'marionette'

    templates = require 'uac/ejs/templates'

    treeData = [
        {
            nodeName: "top level 1",
            nodes: [
                {
                    nodeName: "2nd level, item 1",
                    nodes: [
                        { nodeName: "3rd level, item 1" },
                        { nodeName: "3rd level, item 2" },
                        { nodeName: "3rd level, item 3" }
                    ]
                },
                {
                    nodeName: "2nd level, item 2",
                    nodes: [
                        { nodeName: "3rd level, item 4" },
                        {
                            nodeName: "3rd level, item 5",
                            nodes: [
                                { nodeName: "4th level, item 1" },
                                { nodeName: "4th level, item 2" },
                                { nodeName: "4th level, item 3" }
                            ]
                        },
                        { nodeName: "3rd level, item 6" }
                    ]
                }
            ]
        },
        {
            nodeName: "top level 2",
            nodes: [
                {
                    nodeName: "2nd level, item 3",
                    nodes: [
                        { nodeName: "3rd level, item 7" },
                        { nodeName: "3rd level, item 8" },
                        { nodeName: "3rd level, item 9" }
                    ]
                },
                {
                    nodeName: "2nd level, item 4",
                    nodes: [
                        { nodeName: "3rd level, item 10" },
                        { nodeName: "3rd level, item 11" },
                        { nodeName: "3rd level, item 12" }
                    ]
                }
            ]
        }

    ]

    class TreeNode extends Backbone.Model
        initialize: ->
            nodes = @get("nodes")
            if nodes
                @nodes = new TreeNodeCollection(nodes)
                @unset("nodes")
            return

    class TreeNodeCollection extends Backbone.Collection
        model: TreeNode

    class TreeCompositeView extends Marionette.CompositeView
        template: templates['tree-node.ejs'],

        tagName: "ul",

        initialize:  ->
            console.debug 'TreeCompositeView::initialize'

            # grab the child collection from the parent model
            # so that we can render the collection as children
            # of this parent node
            @collection = @model.nodes

            return

        appendHtml: (collectionView, itemView) ->
            console.debug 'TreeNode::appendHtml'

            # ensure we nest the child list inside of
            # the current list item
            collectionView.$("li:first").append(itemView.el)
            return

    class TreeCollectionView extends Marionette.CollectionView
        itemView: TreeCompositeView
        initialize: ->
            console.debug 'TreeCollectionView::initialize'
            @collection = new TreeNodeCollection(treeData)

            return


    TreeCollectionView