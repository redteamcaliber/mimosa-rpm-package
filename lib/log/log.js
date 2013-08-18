var winston = require('winston');
var settings = require('settings');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            level: settings.get('uac:log_level'),
            colorize: true
        }),
        new (winston.transports.File)({
            level: settings.get('uac:log_level'),
            filename: settings.get('uac:log_file'),
            json: false,
            timestamp: true,
            maxsize: settings.get('uac: log_maxsize'),
            maxfiles: settings.get('uac: log_maxfiles')
        })
    ]
});
module.exports = logger;
