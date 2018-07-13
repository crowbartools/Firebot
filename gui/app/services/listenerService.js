'use strict';
(function() {

    // This helps listening to events coming from the backend

    const _ = require('underscore')._;

    angular
        .module('firebotApp')
        .factory('listenerService', function ($q) {
            let service = {};

            let registeredListeners = {
                filePath: {},
                connectionStatus: {},
                connectionChangeRequest: {},
                constellationConnectionStatus: {},
                constellationConnectionChangeRequest: {},
                chatConnectionStatus: {},
                chatConnectionChangeRequest: {},
                toggleServicesRequest: {},
                chatMessage: {},
                chatUpdate: {},
                eventLog: {},
                error: {},
                updateError: {},
                updateDownloaded: {},
                showEvents: {},
                playSound: {},
                showImage: {},
                showVideo: {},
                showHtml: {},
                showText: {},
                celebrate: {},
                info: {},
                backupComplete: {},
                currentViewersUpdate: {},
                clearEffects: {}
            };

            let ListenerType = {
                IMAGE_FILE: "imageFile",
                SOUND_FILE: "soundFile",
                VIDEO_FILE: "videoFile",
                ANY_FILE: "anyFile",
                IMPORT_FOLDER: "importFolder",
                IMPORT_BACKUP_ZIP: "importBackup",
                CONNECTION_STATUS: "connectionStatus",
                CONNECTION_CHANGE_REQUEST: "connectionChangeRequest",
                CONSTELLATION_CONNECTION_STATUS: "constellationConnectionStatus",
                CONSTELLATION_CONNECTION_CHANGE_REQUEST: "constellationConnectionChangeRequest",
                CHAT_CONNECTION_STATUS: "chatConnectionStatus",
                CHAT_CONNECTION_CHANGE_REQUEST: "chatConnectionChangeRequest",
                TOGGLE_SERVICES_REQUEST: "toggleServicesRequest",
                CHAT_MESSAGE: "chatMessage",
                CHAT_UPDATE: "chatUpdate",
                CURRENT_VIEWERS_UPDATE: "currentViewersUpdate",
                EVENT_LOG: "eventLog",
                ERROR: "error",
                UPDATE_ERROR: "updateError",
                UPDATE_DOWNLOADED: "updateDownloaded",
                API_BUTTON: "apiButton",
                SHOW_EVENTS: "showEvents",
                PLAY_SOUND: "playSound",
                SHOW_IMAGE: "showImage",
                SHOW_VIDEO: "showVideo",
                SHOW_TEXT: "showText",
                SHOW_HTML: "showHtml",
                CELEBREATE: "celebrate",
                INFO: "info",
                BACKUP_COMPLETE: "backupComplete",
                CLEAR_EFFECTS: "clearEffects"
            };

            function runListener(listener, returnPayload) {
                if (listener != null) {
                    let callback = listener.callback;
                    if (typeof callback === 'function') {
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
                let uuid = data.id;
                let filepath = "";
                if (data.path != null) {
                    filepath = data.path[0];
                }

                let listener = registeredListeners.filePath[uuid];
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

                request.data['uuid'] = uuid;

                let listener = {
                    uuid: uuid,
                    type: request.type,
                    callback: callback, // the callback when this listener is triggered
                    runOnce: request.runOnce === true // Means the listener will remove itself after the first time its called
                };

                let publishEvent = request.publishEvent === true;

                switch (listener.type) {
                case ListenerType.VIDEO_FILE:
                case ListenerType.IMAGE_FILE:
                case ListenerType.SOUND_FILE:
                case ListenerType.IMPORT_FOLDER:
                case ListenerType.IMPORT_BACKUP_ZIP:
                case ListenerType.ANY_FILE:
                    registeredListeners.filePath[uuid] = listener;
                    if (publishEvent) {
                        if (listener.type === ListenerType.IMAGE_FILE) {
                            ipcRenderer.send('getImagePath', uuid);
                        } else if (listener.type === ListenerType.SOUND_FILE) {
                            ipcRenderer.send('getSoundPath', uuid);
                        } else if (listener.type === ListenerType.VIDEO_FILE) {
                            ipcRenderer.send('getVideoPath', uuid);
                        } else if (listener.type === ListenerType.IMPORT_FOLDER) {
                            ipcRenderer.send('getImportFolderPath', uuid);
                        } else if (listener.type === ListenerType.IMPORT_BACKUP_ZIP) {
                            ipcRenderer.send('getBackupZipPath', uuid);
                        } else if (listener.type === ListenerType.ANY_FILE) {
                            ipcRenderer.send('getAnyFilePath', request.data);
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
                case ListenerType.VIDEO_FILE:
                case ListenerType.IMAGE_FILE:
                case ListenerType.SOUND_FILE:
                case ListenerType.IMPORT_FOLDER:
                case ListenerType.ANY_FILE:
                case ListenerType.IMPORT_BACKUP_ZIP:
                    delete registeredListeners.filePath[uuid];
                    break;
                default:
                    delete registeredListeners[type][uuid];
                }
            };

            /*
            * Events
            */
            let EventType = {
                DOWNLOAD_UPDATE: "downloadUpdate",
                OPEN_ROOT: "openRootFolder",
                GET_IMAGE: "getImagePath",
                GET_SOUND: "getSoundPath",
                GET_VIDEO: "getVideoPath",
                GET_ANYFILE: "getAnyFilePath",
                SPARK_EXEMPT_UPDATED: "sparkExemptUpdated",
                OPEN_BACKUP: "openBackupFolder",
                INITIATE_BACKUP: "startBackup",
                RESTART_APP: "restartApp",
                DELETE_CHAT_MESSAGE: "deleteChatMessage",
                CHANGE_USER_MOD_STATUS: "changeUserModStatus"
            };
            service.EventType = EventType;

            service.fireEvent = function(type, data) {
                ipcRenderer.send(type, data);
            };

            /**
            * File path event listeners
            */
            ipcRenderer.on('gotSoundFilePath', function (event, data) {
                parseFilePathEvent(data);
            });

            ipcRenderer.on('gotImageFilePath', function (event, data) {
                parseFilePathEvent(data);
            });

            ipcRenderer.on('gotVideoFilePath', function (event, data) {
                parseFilePathEvent(data);
            });

            ipcRenderer.on('gotImportFolderPath', function (event, data) {
                parseFilePathEvent(data);
            });

            ipcRenderer.on('gotBackupZipPath', function (event, data) {
                parseFilePathEvent(data);
            });

            ipcRenderer.on('gotAnyFilePath', function (event, data) {
                parseFilePathEvent(data);
            });



            /**
            * Connection event listeners
            */

            // Interactive Connection Monitor
            // Recieves event from main process that connection has been established or disconnected.
            ipcRenderer.on('connection', function (event, data) {
                let isConnected = data ? (data.toLowerCase() === "online") : false;
                _.forEach(registeredListeners.connectionStatus, (listener) => {
                    runListener(listener, isConnected);
                });
            });

            // Chat Connection Monitor
            // Recieves event from main process that connection has been established or disconnected.
            ipcRenderer.on('chatConnection', function (event, data) {
                let isChatConnected = data ? (data.toLowerCase() === "online") : false;
                _.forEach(registeredListeners.chatConnectionStatus, (listener) => {
                    runListener(listener, isChatConnected);
                });
            });

            // Constellation Connection Monitor
            // Recieves event from main process that connection has been established or disconnected.
            ipcRenderer.on('constellationConnection', function (event, data) {
                let isConstellationConnected = data ? (data.toLowerCase() === "online") : false;
                _.forEach(registeredListeners.constellationConnectionStatus, (listener) => {
                    runListener(listener, isConstellationConnected);
                });
            });

            // Toggle Services Request Monitor
            ipcRenderer.on('toggleServicesRequest', function (event, data) {
                let services = data ? data : [];
                _.forEach(registeredListeners.toggleServicesRequest, (listener) => {
                    runListener(listener, services);
                });
            });

            // Interactive Connect Request
            // Recieves an event from the main process when the global hotkey is hit for connecting.
            ipcRenderer.on('getRefreshToken', function () {
                _.forEach(registeredListeners.connectionChangeRequest, (listener) => {
                    runListener(listener, null);
                });
            });

            // Chat Connect Request
            // Recieves an event from the main process when the global hotkey is hit for connecting.
            ipcRenderer.on('getChatRefreshToken', function () {
                _.forEach(registeredListeners.chatConnectionChangeRequest, (listener) => {
                    runListener(listener, null);
                });
            });

            // Chat Message
            // Recieves an event from main process when a chat message is processed.
            ipcRenderer.on('chatMessage', function (event, data) {
                _.forEach(registeredListeners.chatMessage, (listener) => {
                    runListener(listener, data);
                });
            });

            // Chat Update
            // Recieves an event from main process when a chat event happens.
            ipcRenderer.on('chatUpdate', function (event, data) {
                _.forEach(registeredListeners.chatUpdate, (listener) => {
                    runListener(listener, data);
                });
            });

            // current viewers
            // Recieves an event from main process when a current viewer count has changed
            ipcRenderer.on('currentViewersUpdate', function (event, data) {
                _.forEach(registeredListeners.currentViewersUpdate, (listener) => {
                    runListener(listener, data);
                });
            });

            /**
            * Event log event listener
            */
            ipcRenderer.on('eventlog', function (event, data) {
                _.forEach(registeredListeners.eventLog, (listener) => {
                    runListener(listener, data);
                });
            });

            /**
            * Error event listener
            */
            ipcRenderer.on('error', function (event, errorMessage) {
                _.forEach(registeredListeners.error, (listener) => {
                    runListener(listener, errorMessage);
                });
            });

            /**
            * Info event listener
            */
            ipcRenderer.on('info', function (event, infoMessage) {
                _.forEach(registeredListeners.info, (listener) => {
                    runListener(listener, infoMessage);
                });
            });


            /**
            * Update error listener
            */
            ipcRenderer.on('updateError', function (event, errorMessage) {
                _.forEach(registeredListeners.updateError, (listener) => {
                    runListener(listener, errorMessage);
                });
            });

            /**
            * Update download listener
            */
            ipcRenderer.on('updateDownloaded', function () {
                _.forEach(registeredListeners.updateDownloaded, (listener) => {
                    runListener(listener);
                });
            });

            /**
            * Show img event listener
            */
            ipcRenderer.on('showimage', function (event, data) {
                _.forEach(registeredListeners.showImage, (listener) => {
                    runListener(listener, data);
                });
            });

            /**
            * Show video event listener
            */
            ipcRenderer.on('showvideo', function (event, data) {
                _.forEach(registeredListeners.showVideo, (listener) => {
                    runListener(listener, data);
                });
            });

            /**
            * Show html event listener
            */
            ipcRenderer.on('showhtml', function (event, data) {
                _.forEach(registeredListeners.showHtml, (listener) => {
                    runListener(listener, data);
                });
            });

            /**
            * Show text event listener
            */
            ipcRenderer.on('showtext', function (event, data) {
                _.forEach(registeredListeners.showText, (listener) => {
                    runListener(listener, data);
                });
            });

            /**
            * Show Events listener
            */
            ipcRenderer.on('showEvents', function (event, data) {
                _.forEach(registeredListeners.showEvents, (listener) => {
                    runListener(listener, data);
                });
            });

            /**
            * Play sound event listener
            */
            ipcRenderer.on('playsound', function (event, data) {
                _.forEach(registeredListeners.playSound, (listener) => {
                    runListener(listener, data);
                });
            });

            /**
             *  Show Celebration animation
             */
            ipcRenderer.on('celebrate', function (event, data) {
                _.forEach(registeredListeners.celebrate, (listener) => {
                    runListener(listener, data);
                });
            });

            /**
            * Update download listener
            */
            ipcRenderer.on('backupComplete', function (event, data) {
                _.forEach(registeredListeners.backupComplete, (listener) => {
                    runListener(listener, data);
                });
            });

            /**
            * Clear effect listener
            */
            ipcRenderer.on('clearEffects', function (event, data) {
                _.forEach(registeredListeners.clearEffects, (listener) => {
                    runListener(listener, data);
                });
            });



            /**
            *  Helpers
            */

            return service;
        });
}());
