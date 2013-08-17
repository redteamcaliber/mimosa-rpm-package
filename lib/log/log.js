var winston = require('winston');
var settings = require('settings');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            level: settings.get('uac:log_level')
        }),
        new (winston.transports.File)({
            level: settings.get('uac:log_level'),
            filename: settings.get('uac:log_file')
        })
    ]
});
module.exports = logger;
