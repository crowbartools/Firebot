var winston = require('winston');
require('winston-daily-rotate-file');
var dataAccess = require('./data-access.js')

var transport = new winston.transports.DailyRotateFile({
    filename: dataAccess.getPathInUserData('/user-settings/logs')+'/log',
    datePattern: 'yyyy-MM-dd.',
    prepend: true,
    json: false,
    handleExceptions: true,
    humanReadableUnhandledException: true,
    timestamp: function() {
        return new Date().toTimeString();
    },
    formatter: function(options) {
        return options.timestamp()+': v'+require('electron').remote.app.getVersion()+' : '+ options.level.toUpperCase() +' '+ (options.message ? options.message : '') + (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
    }
})

var logger = new (winston.Logger)({
  transports: [
    transport
  ]
});

function log(message){
    logger.info(message);
    console.log('Error logged: '+ message);
}

// Export
exports.log = log;
