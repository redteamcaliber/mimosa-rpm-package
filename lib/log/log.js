var winston = require('winston');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            level: 'debug'
        }),
        new (winston.transports.File)({
            level: 'error',
            filename: './logs/uac.log'
        })
    ]
});
module.exports = logger;
