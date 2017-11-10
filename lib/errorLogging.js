'use strict';

const electron = require('electron');
let winston = require('winston');
require('winston-daily-rotate-file');
let dataAccess = require('./common/data-access.js');

let app = (electron.app || electron.remote.app);

let transport = new winston.transports.DailyRotateFile({
    filename: dataAccess.getPathInUserData('/user-settings/logs') + '/log',
    datePattern: 'yyyy-MM-dd.',
    prepend: true,
    json: false,
    handleExceptions: false,
    humanReadableUnhandledException: true,
    exitOnError: false,
    timestamp: function() {
        return new Date().toTimeString();
    },
    formatter: function(options) {
        return options.timestamp() + ': v' + app.getVersion() + ' : ' + options.level.toUpperCase() + ' ' + (options.message ? options.message : '') + (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
    }
});

let logger = new (winston.Logger)({
    transports: [
        transport
    ]
});

function log(message) {
    logger.info(message);
    console.log('Error logged: ' + message);
}

// Export
exports.log = log;
