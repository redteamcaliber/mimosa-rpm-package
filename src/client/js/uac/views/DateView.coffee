define (require) ->

  Backbone = require 'backbone'
  Marionette = require 'marionette'
  View = require 'uac/views/View'
  templates = require 'uac/ejs/templates'
  datepicker = require 'bootstrap_datepicker'
  vent = require 'uac/common/vent'
  reqres = require 'uac/common/reqres'

  class DateView extends Marionette.ItemView

    template: templates['datefield.ejs']

    serializeData: ()=>
        label: @label

    ###
      label                     #the label to display for this date picker
      overrides                 #any overrides to the date picker component itself
        pickDate                #disables the date picker
        pickTime                #disables the time picker
        useMinutes              #disables the minutes picker
        useSeconds              #disables the seconds picker
        useCurrent              #when true, picker will set the value to the current date/time
        minuteStepping          #set the minute stepping
        minDate                 #set a minimum date
        maxDate                 #set a maximum date (defaults to today +100 years)
        showToday               #shows the today indicator
        language                #sets language locale
        defaultDate             #sets a default date, accepts js dates, strings and moment objects
        disabledDates           #an array of dates that cannot be selected
        enabledDates            #an array of dates that can be selected
        icons                   #classes to use with icons
        useStrict               #use "strict" when validating dates
        sideBySide              #show the date and time picker side by side
        daysOfWeekDisabled      #for example use daysOfWeekDisabled: [0,6] to disable weekends
      linkedPicker              #link another picker to this date picker for set min / max dates
        instanceName            #the name of the picker to listen to
        type                    #what to do when a change event is rcvd
      instanceName              #the name for this instance of the datepicker
      topicGenerator            #function that will return the name of events to publish
    ###
    initialize: (options = {})->

      {@label, @overrides, @linkedPicker, @instanceName, @topicGenerator} = options

      unless _.isString @instanceName then @instanceName = @cid

      unless _.isFunction @topicGenerator then @topicGenerator = (eventType, instanceName=@instanceName)=>
        "#{@constructor.name}:#{instanceName}:#{eventType}"

      #Setters
      vent.on @topicGenerator("setDate"), (event)=> @$(".date").data("DateTimePicker").setDate(event)
      vent.on @topicGenerator("toggle"), (toggle)=>
        if toggle
          @$(".date").data("DateTimePicker").disable()
        else
          @$(".date").data("DateTimePicker").enable()

      #Getters
      reqres.setHandler @topicGenerator("getDate"), => @getDate()
      reqres.setHandler @topicGenerator("getEpoch"), => @getEpoch()

    #you can pass in either a Moment or a Date, so assume its one or the other
    getDate: =>
      date = @$(".date").data("DateTimePicker").getDate()
      unless _.isDate(date)
        if _.isNull date then date = null
        else date = date.toDate()
      return date

    #return the current selection as UNIX Epoch
    getEpoch: => unless _.isNull @getDate() then Math.ceil(@getDate().getTime()/1000) else null

    clear: => @$(".date").data("DateTimePicker").setValue("")

    onRender: ->
      #render to the screen
      @$(".date").datetimepicker @overrides

      #proxy raw jquery events into BS events and update local handle on date
      @$(".date").on "dp.change", (event)=>
        @date = event.date
        vent.trigger @topicGenerator("change"), event

      #setup linkedPicker if defined
      if _.isObject @linkedPicker then vent.on @topicGenerator("change", @linkedPicker.instanceName), (event)=>


        if @linkedPicker.type == "min"
          method= "setMinDate"
        else if @linkedPicker.type == "max"
          method = "setMaxDate"
        else
          return

        @$(".date").data("DateTimePicker")[method](event.date)

  DateView