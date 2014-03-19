assert = require 'assert'
should = require 'should'

#
# Make sure the object (o) has all keys specified in the list (keys).
#
should_have_keys = (o, keys) ->
    if Array.isArray(o)
        for item in o
            for k in keys
                should.exist item[k]
    else
        for k in keys
            should.exist o[k]
    return

#
# Assert the object is a list and optionally contains values.
#
should_be_list = (list, should_contain_items) ->
    should.exist list
    should.exist list.length
    if should_contain_items
        list.length.should.be.greaterThan 0
    return

#
# Exports
#
exports.should_have_keys = should_have_keys
exports.should_be_list = should_be_list