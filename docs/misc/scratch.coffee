

class UserListView extends Backbone.View
    events:
        "click .user": "userClicked"

    userClicked: ->
        user = {} # get the user that was clicked
        @trigger "selected", user
        return
    ## ...

class UserDetailView extends Backbone.View
    # ...

class UserManagementView extends Backbone.View
    # He actually doesn't show the creation of this view in his example.
    this.user_list_view = new UserListView
        el: @$('#somedivInTheCachedElement')

    this.listenTo "selected", (user) ->
        view = new UserDetailView
            model: user
        @$("#detail").html view.render().el

    render: ->
        this.user_list_view.render()


# Some main class...

user_management = new UserManagementView()
$('some-div').append user_management.render().el