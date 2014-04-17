define (require) ->

    mocha = require 'mocha'
    chai = require 'chai'

    should = chai.should()

    chai_jquery = require 'chai-jquery'
    chai.use(chai_jquery)

    mocha.setup('bdd')

    require [
        'test/evented-tests',
    ], (require) ->
        mocha.run()
        return
