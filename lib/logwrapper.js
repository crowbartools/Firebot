'use strict';

const electron = require('electron');
let winston = require('winston');
let dataAccess = require('./common/data-access.js');
let config = winston.config;
let app = (electron.app || electron.remote.app);


let logger = new (winston.Logger)({
    level: "silly",
    transports: [
        new (winston.transports.Console)({
            level: "silly",
            exitOnError: false,
            timestamp: function() {
                return Date.now();
            },
            formatter: function(options) {
                return config.colorize(options.level, options.level.toUpperCase()) + ' ' +
                (options.message ? options.message : '') +
                (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
            }
        }),
        new (require('winston-daily-rotate-file'))({
            level: "info",
            filename: dataAccess.getPathInUserData('/user-settings/logs') + '/log',
            datePattern: 'yyyy-MM-dd.',
            prepend: true,
            json: false,
            handleExceptions: true,
            humanReadableUnhandledException: true,
            exitOnError: false,
            timestamp: function() {
                return new Date().toTimeString();
            },
            formatter: function(options) {
                return options.timestamp() + ' [v' + app.getVersion() + '] ' + options.level.toUpperCase() + ': ' +
                    (options.message ? options.message : '') + (options.meta && Object.keys(options.meta).length ? '\n\t' +
                    JSON.stringify(options.meta) : '');
            }
        })
    ]
});

// Export
module.exports = logger;
