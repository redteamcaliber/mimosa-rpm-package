assert = require 'assert'
should = require 'should'

#
# Make sure the object (o) has all keys specified in the list (keys).
should_have_keys = (o, keys) ->
    if Array.isArray(o)
        for item in o
            for k in keys
                should.exist item[k]
    else
        for k in keys
            should.exist o[k]

#
# Exports
#
exports.should_have_keys = should_have_keys