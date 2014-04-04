define (require) ->

  _  = require 'underscore'
  _s = require 'underscore.string'
  _.mixin(_s.exports())

  MD5ContentView = require 'uac/views/MD5ContentView'
  MD5Model = require 'uac/models/MD5Model'

  md5Model = new MD5Model()
  md5View = new MD5ContentView
    el: '#md5hashes'
    model: md5Model

  md5View.render()

  md5Model.set 'id', UAC.hash,
    silent: true

  md5Model.fetch()


  return