"use strict";

(function() {
    angular.module("firebotApp")
        .factory("logger", function() {
            const service = {};

            function callLogger(type, ...args) {
                if (type != null && args != null) {
                    // Connection issues should be logged as "warn".
                    if (args[0] === "read ECONNRESET") {
                        type = "warn";
                    }

                    ipcRenderer.send("logging", {
                        level: type,
                        message: args[0],
                        meta: args.length > 1 ? args.slice(1) : undefined
                    });
                }
            }

            // Wrappers for the main Winston Logger methods
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