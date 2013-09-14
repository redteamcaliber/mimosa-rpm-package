var assert = require('assert');
var vows = require('vows');
var _ = require('underscore.string');
var moment = require('moment');

var api = require('sf-api');


process.on('uncaughtException', function (err) {
    console.error('Runtime error occurred during test execution...');
    console.error(err.stack);
    process.exit();
});


// Setup logging.
var log = require('winston');
log.remove(log.transports.Console);
log.add(log.transports.Console, {
    level: 'debug',
    colorize: true
});


// Test Utils.
function assert_no_errors(err) {
    assert(!err, typeof err == 'string' || err instanceof String ? err : JSON.stringify(err));
}

function assert_collection_length(collection) {
    assert(collection, 'collection is not null');
    assert(collection.length > 0, 'collection length is greater than zero');
}

function assert_valid_models(collection, fn) {
    collection.forEach(function (model) {
        assert(model, 'model is not null');
        fn(model.attributes);
    })
}

function assert_model(model, attributes) {
    assert(model, 'model is valid');
    _.each(attributes, function (value, key) {
        assert.equal(value, model.get(key), 'Validating attribute: ' + key);
    });
}

function assert_suppression(suppression) {
    // TODO:
    assert(suppression);
}


suppressions_batch = {
    suppressions_tests: {
        get_suppressions_test: {
            topic: function () {
                api.find_suppressions(this.callback);
            },
            no_errors: function (err, suppressions) {
                assert_no_errors(err);
            },
            suppressions_exist: function (err, suppressions) {
                assert_collection_length(suppressions);
            },
            suppressions_valid: function (err, suppressions) {
                assert_valid_models(suppressions, assert_suppression);
            }
        }
    }
};

vows.describe('UAC StrikeFinder API Test')
    .addBatch(suppressions_batch)
    .export(module);
