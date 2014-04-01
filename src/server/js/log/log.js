var winston = require('winston');
var settings = require('settings');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            level: settings.get('server:log_level'),
            colorize: true
        }),
        new (winston.transports.File)({
            level: settings.get('server:log_level'),
            filename: settings.get('server:log_file'),
            json: false,
            timestamp: true,
            maxsize: settings.get('server:log_maxsize'),
            maxfiles: settings.get('server:log_maxfiles')
        })
    ]
});
module.exports = logger;
