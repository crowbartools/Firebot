'use strict';

(function() {

    const logger = require('../../lib/logwrapper');

    angular
        .module('firebotApp')
        .factory('logger', function () {

            let service = {};

            function callLogger(type, ...args) {
                if (args != null && args.length > 0) {
                    if (typeof args[0] === 'string' || args[0] instanceof String) {
                        args[0] = "(Renderer) " + args[0];
                    }
                }
                return logger[type](...args);
            }

            service.error = (...args) => {
                return callLogger("error", ...args);
            };

            service.warn = (...args) => {
                return callLogger("warn", ...args);
            };

            service.info = (...args) => {
                return callLogger("info", ...args);
            };

            service.verbose = (...args) => {
                return callLogger("verbose", ...args);
            };

            service.debug = (...args) => {
                return callLogger("debug", ...args);
            };

            service.silly = (...args) => {
                return callLogger("silly", ...args);
            };

            service.log = (type, ...args) => {
                args[0] = "(Renderer) " + args[0];
                return logger.log(type, ...args);
            };

            logger.on('logging', (transport, level, msg, meta) => {
                if (transport != null && transport.name === 'console') {
                    console.log(level.toUpperCase() + ": " + msg);
                    if (meta && Object.keys(meta).length > 0) {
                        console.log(meta);
                    }
                }
            });

            return service;
        });
}(window.angular));
