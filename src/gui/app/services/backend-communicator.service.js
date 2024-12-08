"use strict";

(function() {

    /*
        This service is the new way to communicate to the backend.
        It ensures we do not cause a memory leak by registering the same listener for an event on ipcRenderer
    */

    angular
        .module("firebotApp")
        .factory("backendCommunicator", function($q) {

            const { v4: uuid } = require("uuid");

            const service = {};

            const knownEvents = new Set();

            const listeners = {};

            function registerEventWithElectron(eventName) {
                knownEvents.add(eventName);

                return (function(name) {
                    ipcRenderer.on(name, function(_, data) {
                        const eventListeners = listeners[name];
                        for (const listener of eventListeners) {
                            if (listener.async) {
                                listener.callback(data).then((returnValue) => {
                                    service.fireEvent(`${name}:reply`, returnValue);
                                });
                            } else {
                                $q.resolve(true, () => listener.callback(data));
                            }
                        }
                    });
                })(eventName);
            }

            service.on = function(eventName, callback, async = false) {

                if (typeof callback !== "function") {
                    throw new Error("Can't register an event without a callback.");
                }

                const id = uuid(),
                    event = {
                        id: id,
                        callback: callback,
                        async: async
                    };


                if (listeners.hasOwnProperty(eventName)) {
                    listeners[eventName].push(event);
                } else {
                    listeners[eventName] = [event];
                    registerEventWithElectron(eventName);
                }

                return id;
            };

            service.onAsync = (eventName, callback) => service.on(eventName, callback, true);

            service.fireEventAsync = function(type, data) {
                if (data !== undefined) {
                    data = JSON.parse(JSON.stringify(data));
                }
                return $q.when(new Promise((resolve) => {
                    ipcRenderer.send(type, data);
                    ipcRenderer.once(`${type}:reply`, (_, eventData) => {
                        resolve(eventData);
                    });
                }));
            };

            service.fireEventSync = function(type, data) {
                return ipcRenderer.sendSync(type, data);
            };

            service.fireEvent = function(type, data) {
                ipcRenderer.send(type, data);
            };

            service.send = service.fireEvent;

            return service;
        });
})();
