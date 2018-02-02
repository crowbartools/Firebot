'use strict';

(function() {

    const logger = require('../../lib/logwrapper');

    angular
        .module('firebotApp')
        .factory('logger', function () {

            logger.on('logging', function (transport, level, msg, meta) {
                if (transport != null && transport.name === 'console') {
                    console.log(level.toUpperCase() + ": " + msg);
                    if (meta) {
                        console.log(meta);
                    }
                }
            });

            return logger;
        });
}(window.angular));
