define (require) ->

  Backbone = require 'backbone'

  class MD5Model extends Backbone.Model

    defaults:
      vt: {}
    urlRoot: "/api/md5"
  MD5Model