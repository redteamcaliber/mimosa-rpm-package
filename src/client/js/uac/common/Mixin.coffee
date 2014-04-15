###
  A wrapper for Cocktail in case we decide to use another mixin package in the future
###
define (require)->
  Cocktail = require 'cocktail'

  -> Cocktail.mixin.apply(this, arguments)
