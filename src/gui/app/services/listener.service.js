"use strict";
(function() {
    // This helps listening to events coming from the backend

    const _ = require("underscore")._;

    angular.module("firebotApp").factory("listenerService", function($q) {
        const service = {};

        const registeredListeners = {
            filePath: {},
            updateError: {},
            updateDownloaded: {},
            installingUpdate: {},
            integrationConnectionUpdate: {},
            integrationsUpdated: {}
        };

        const ListenerType = {
            ANY_FILE: "anyFile",
            UPDATE_ERROR: "updateError",
            UPDATE_DOWNLOADED: "updateDownloaded",
            INSTALLING_UPDATE: "installingUpdate",
            INTEGRATION_CONNECTION_UPDATE: "integrationConnectionUpdate",
            INTEGRATIONS_UPDATED: "integrationsUpdated"
        };

        function runListener(listener, returnPayload) {
            if (listener != null) {
                const callback = listener.callback;
                if (typeof callback === "function") {
                    // $q is angulars implementation of the promise protocol. We are creating and instantly resolving a promise, then we run the callback.
                    // This simply ensures any scope varibles are updated if needed.
                    $q.resolve(true, () => callback(returnPayload));
                }
                if (listener.runOnce === true) {
                    service.unregisterListener(listener.type, listener.uuid);
                }
            }
        }

        function parseFilePathEvent(data) {
            const uuid = data.id;
            let filepath = "";
            if (data.path != null) {
                filepath = data.path[0];
            }

            const listener = registeredListeners.filePath[uuid];
            runListener(listener, filepath);
        }

        service.ListenerType = ListenerType;

        service.registerListener = function(request, callback) {
            let uuid = request.uuid;
            if (uuid == null) {
                uuid = _.uniqueId();
            }

            if (request.data == null) {
                request.data = {};
            }

            request.data["uuid"] = uuid;

            const listener = {
                uuid: uuid,
                type: request.type,
                callback: callback, // the callback when this listener is triggered
                runOnce: request.runOnce === true // Means the listener will remove itself after the first time it is called
            };

            const publishEvent = request.publishEvent === true;

            switch (listener.type) {
                case ListenerType.ANY_FILE:
                    registeredListeners.filePath[uuid] = listener;
                    if (publishEvent) {
                        if (listener.type === ListenerType.ANY_FILE) {
                            ipcRenderer.send("getAnyFilePath", request.data);
                        }
                    }
                    break;
                default:
                    registeredListeners[listener.type][uuid] = listener;
            }

            return uuid;
        };

        service.unregisterListener = function(type, uuid) {
            switch (type) {
                case ListenerType.ANY_FILE:
                    delete registeredListeners.filePath[uuid];
                    break;
                default:
                    delete registeredListeners[type][uuid];
            }
        };

        /*
    * Events
    */
        const EventType = {
            GET_ANYFILE: "getAnyFilePath"
        };
        service.EventType = EventType;

        /**
     * File path event listeners
     */
        ipcRenderer.on("gotAnyFilePath", function(event, data) {
            parseFilePathEvent(data);
        });

        /**
     * Update error listener
     */
        ipcRenderer.on("updateError", function(event, errorMessage) {
            _.forEach(registeredListeners.updateError, (listener) => {
                runListener(listener, errorMessage);
            });
        });

        /**
     * Update download listener
     */
        ipcRenderer.on("updateDownloaded", function() {
            _.forEach(registeredListeners.updateDownloaded, (listener) => {
                runListener(listener);
            });
        });

        // Installing update listener
        ipcRenderer.on(ListenerType.INSTALLING_UPDATE, function () {
            _.forEach(registeredListeners[ListenerType.INSTALLING_UPDATE], (listener) => {
                runListener(listener);
            });
        });

        /**
     * integration conn update listener
     */
        ipcRenderer.on("integrationConnectionUpdate", function(event, data) {
            _.forEach(registeredListeners.integrationConnectionUpdate, (listener) => {
                runListener(listener, data);
            });
        });

        /**
     * integrations updated listener
     */
        ipcRenderer.on("integrationsUpdated", function(event, data) {
            _.forEach(registeredListeners.integrationsUpdated, (listener) => {
                runListener(listener, data);
            });
        });

        return service;
    });
}());