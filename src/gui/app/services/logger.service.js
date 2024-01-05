"use strict";

(function() {
    const logger = require("../../backend/logwrapper");

    angular.module("firebotApp").factory("logger", function() {
        const service = {};

        function prefixMsgInArgs(...args) {
            let msg = "(Renderer)";
            if (args != null && args.length > 0) {
                if (typeof args[0] === "string" || args[0] instanceof String) {
                    msg += ` ${args.shift()}`;
                }
            }
            args.unshift(msg);
            return args;
        }

        function callLogger(type, ...args) {
            if (type != null && args != null) {
                // Connection issues should be logged as "warn".
                if (args[0] === "read ECONNRESET") {
                    const argsNew = prefixMsgInArgs(...args);
                    return logger["warn"](...argsNew);
                }

                const argsNew = prefixMsgInArgs(...args);
                return logger[type](...argsNew);
            }
        }

        /** Wrappers for the main Winston Logger methods. All these do is prefix the "msg" argument
     * with "(Renderer)" so its easier to differentiate logs from the renderer vs main processes
     * in the log file
     */
        service.error = (...args) => {
            return callLogger("error", ...args);
        };

        service.warn = (...args) => {
            return callLogger("warn", ...args);
        };

        service.warning = (...args) => {
            return service.warn(...args);
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
            if (type != null && args != null) {
                const argsNew = prefixMsgInArgs(...args);
                return logger.log(type, ...argsNew);
            }
        };

        return service;
    });
}(window.angular));
