"use strict";

(function() {
    angular.module("firebotApp")
        .factory("logger", function() {
            const service = {};

            function prefixMsgInArgs(...args) {
                let msg = "[Renderer]";
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
                    const argsNew = prefixMsgInArgs(...args);

                    // Connection issues should be logged as "warn".
                    if (args[0] === "read ECONNRESET") {
                        type = "warn";
                    }

                    ipcRenderer.send("logging", {
                        level: type,
                        message: argsNew[0],
                        meta: argsNew.length > 1 ? argsNew.slice(1) : undefined
                    });
                }
            }

            /** Wrappers for the main Winston Logger methods. All these do is prefix the "msg" argument
             * with "[Renderer]" so it's easier to differentiate logs from the renderer vs main processes
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
                return callLogger(type, ...args);
            };

            return service;
        });
}());