define (require) ->

    mocha = require 'mocha'
    chai = require 'chai'
    should = chai.should()

    Marionette = require 'marionette'
    reqres = require 'uac/common/reqres'

    mixin = require 'uac/common/Mixin'
    Evented = require 'uac/common/mixins/Evented'


    get_test_instance = ->
        class TestClass extends Marionette.View
            initialize: (options) ->
                super

                if options and options.instanceName
                    @instanceName = options.instanceName

                @count = 0

                @registerSync
                    eventName: 'get_count'
                    handler: =>
                        @get_count()

                return

            get_count: ->
                @count = @count + 1

        # Mixin Evented into the test class.
        mixin TestClass, Evented

        new TestClass
            instanceName: 'testInstance'

    #
    # Test of the Evented mixin class.
    #
    describe 'EventedTests', ->

        describe '#get_test_instance()', ->
            it 'should exist', ->
                # Test class should exist.
                should.exist get_test_instance()
                return
            it 'should have Evented mixed in', ->
                # Evented should be mixed in.
                should.exist get_test_instance().registerSync
                return
            it 'should be named testInstance', ->
                # The test instance should be named testInstance.
                get_test_instance().instanceName.should.equal 'testInstance'
                return
            after ->
                # Clean up any handlers before the next set of tests.
                reqres.removeAllHandlers()

        describe '#Evented.reqres()', ->
            it 'should return undefined if no instances are available', ->
                count = reqres.request 'TestClass:testInstance:get_count'
                should.not.exist count
                return
            it 'should return 1 from get_count()', ->
                should.equal 1, get_test_instance().get_count()
                return
            it 'should retrieve the count using reqres', ->
                test = get_test_instance()
                count = reqres.request 'TestClass:testInstance:get_count'
                should.exist count
                count.should.equal 1

                count = reqres.request 'TestClass:testInstance:get_count'
                should.exist count
                count.should.equal 2
                return

            it 'should print the reqres', ->
                console.dir reqres
                console.dir reqres._wreqrHandlers['TestClass:testInstance:get_count']



