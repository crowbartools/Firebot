'use strict';

const electron = require('electron');
let winston = require('winston');
let dataAccess = require('./common/data-access.js');
let config = winston.config;
let app = (electron.app || electron.remote.app);
let Sentry = require('winston-raven-sentry');


let settingsfile = dataAccess.getJsonDbInUserData("/user-settings/settings");
let rotateFileLogLevel = "info";

let debugMode = false;
try {
    debugMode = settingsfile.getData('/settings/debugMode');
} catch (err) {
    console.warn(err.message); //eslint-disable-line no-console
}
if (debugMode === true) {
    rotateFileLogLevel = 'debug';
}


let logger = new (winston.Logger)({
    level: "silly",
    exitOnError: false,
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
            level: rotateFileLogLevel,
            filename: dataAccess.getPathInUserData('/user-settings/logs') + '/log',
            datePattern: 'yyyy-MM-dd.',
            prepend: true,
            json: false,
            maxDays: 7,
            handleExceptions: true,
            humanReadableUnhandledException: true,
            exitOnError: false,
            timestamp: function() {
                return new Date().toTimeString();
            },
            formatter: function(options) {
                let prefix = options.timestamp() + ' [v' + app.getVersion() + '] ' + options.level.toUpperCase() + ': ';

                let message = options.message ? options.message : '';

                let output = prefix + message;

                let meta = options.meta;
                if (Object.keys(meta).length >= 5
                      && meta.hasOwnProperty('date')
                      && meta.hasOwnProperty('process')
                      && meta.hasOwnProperty('os')
                      && meta.hasOwnProperty('trace')
                      && meta.hasOwnProperty('stack')) {

                    //
                    // If meta carries unhandled exception data serialize the stack nicely
                    //
                    let stack = meta.stack;
                    delete meta.stack;
                    delete meta.trace;
                    output += ' | ' + serialize(meta); //eslint-disable-line

                    if (stack) {
                        output += '\n' + stack.join('\n');
                    }
                } else if (Object.keys(meta).length > 0) {
                    output += ' | ' + serialize(meta); //eslint-disable-line
                }

                return output;
            }
        }),
        new Sentry({
            dsn: 'https://c4ba7c4b47814f8e88886ca08414aad4:a960630da816494fbe756e61116812e8@sentry.io/285894',
            level: 'error',
            server_name: dataAccess.getStreamerUsername(), //eslint-disable-line
            install: true,
            captureUnhandledRejections: true,
            exitOnError: false,
            tags: {
                username: dataAccess.getStreamerUsername(),
                version: app.getVersion()
            }
        })
    ]
});

// Export
module.exports = logger;

// ### function serialize (obj, key)
// #### @obj {Object|literal} Object to serialize
// #### @key {string} **Optional** Optional key represented by obj in a larger object
// Performs simple comma-separated, `key=value` serialization for Loggly when
// logging to non-JSON inputs.
function serialize(obj, key) {
    // symbols cannot be directly casted to strings
    if (typeof key === 'symbol') {
        key = key.toString();
    }
    if (typeof obj === 'symbol') {
        obj = obj.toString();
    }

    if (obj === null) {
        obj = 'null';
    } else if (obj === undefined) {
        obj = 'undefined';
    } else if (obj === false) {
        obj = 'false';
    }

    if (typeof obj !== 'object') {
        return key ? key + '=' + obj : obj;
    }

    if (obj instanceof Buffer) {
        return key ? key + '=' + obj.toString('base64') : obj.toString('base64');
    }

    let msg = '',
        keys = Object.keys(obj),
        length = keys.length;

    for (let i = 0; i < length; i++) {
        if (Array.isArray(obj[keys[i]])) {
            msg += keys[i] + '=[';

            for (let j = 0, l = obj[keys[i]].length; j < l; j++) {
                msg += serialize(obj[keys[i]][j]);
                if (j < l - 1) {
                    msg += ', ';
                }
            }

            msg += ']';
        } else if (obj[keys[i]] instanceof Date) {
            msg += keys[i] + '=' + obj[keys[i]];
        } else {
            msg += serialize(obj[keys[i]], keys[i]);
        }

        if (i < length - 1) {
            msg += ', ';
        }
    }

    return msg;
}
