'use strict';

(function() {

    const WebSocket = require('ws');
    const WebSocketServer = WebSocket.Server;

    // This provides methods for sending stuff to the websocket

    angular
        .module('firebotApp')
        .factory('websocketService', function (logger, listenerService, settingsService, $timeout, $interval, $rootScope) {
            let service = {};

            // Setup the WebSocketServer with the saved port.
            let port = settingsService.getWebSocketPort();
            const wss = new WebSocketServer({
                port: port
            });

            function showEvents(data) {
                let showEventsPosition = data.showEventsPosition;
                let showEventsHeight = data.showEventsHeight;
                let showEventsWidth = data.showEventsWidth;
                let showEventsDuration = parseFloat(data.showEventsDuration);
                let showEventsColor = data.showEventsColor;
                let showEventsBackgroundColor = data.showEventsBackgroundColor;
                let showEventsFontSize = data.showEventsFontSize;
                let showEventsType = data.showEventsType;
                let showEventsAlignment = data.showEventsAlignment;

                // Set defaults if they werent filled out.
                if (showEventsPosition === "" || showEventsPosition == null) {
                    showEventsPosition = "Top Middle";
                }
                if (showEventsHeight === "" || showEventsHeight == null) {
                    showEventsHeight = false;
                }
                if (showEventsWidth === "" || showEventsWidth == null) {
                    showEventsWidth = false;
                }
                if (showEventsDuration === "" || showEventsDuration == null) {
                    showEventsDuration = 5;
                }
                if (showEventsColor === "" || showEventsColor == null) {
                    showEventsColor = "#ffffff";
                }
                if (showEventsBackgroundColor === "" || showEventsBackgroundColor == null) {
                    showEventsBackgroundColor = "transparent";
                }
                if (showEventsFontSize === "" || showEventsFontSize == null) {
                    showEventsFontSize = "1em";
                }

                // Compile data and send to overlay.
                let broadCastData = {
                    "event": "showEvents",
                    "showEventsType": showEventsType,
                    "resourceToken": data.resourceToken,
                    "showEventsText": data.showEventsText,
                    "showEventsAlignment": showEventsAlignment,
                    "showEventsColor": showEventsColor,
                    "showEventsBackgroundColor": showEventsBackgroundColor,
                    "showEventsFontSize": showEventsFontSize,
                    "showEventsPosition": showEventsPosition,
                    "showEventsHeight": showEventsHeight,
                    "showEventsWidth": showEventsWidth,
                    "showEventsDuration": showEventsDuration,
                    "enterAnimation": data.enterAnimation,
                    "exitAnimation": data.exitAnimation,
                    "customCoords": data.customCoords
                };

                service.broadcast(broadCastData);
            }

            function showImage(data) {
                logger.debug("Showing image... ");

                let filepath = data.filepath;
                let imagePosition = data.imagePosition;
                let imageHeight = data.imageHeight;
                let imageWidth = data.imageWidth;
                let imageDuration = parseFloat(data.imageDuration);

                // Set defaults if they werent filled out.
                if (imagePosition === "" || imagePosition == null) {
                    imagePosition = "Top Middle";
                }
                if (imageHeight === "" || imageHeight == null) {
                    imageHeight = false;
                }
                if (imageWidth === "" || imageWidth == null) {
                    imageWidth = false;
                }
                if (imageDuration === "" || imageDuration == null) {
                    imageDuration = 5;
                }

                // Compile data and send to overlay.
                let broadCastData = {
                    "event": "image",
                    "filepath": filepath,
                    "url": data.url,
                    "imageType": data.imageType,
                    "resourceToken": data.resourceToken,
                    "imagePosition": imagePosition,
                    "imageHeight": imageHeight,
                    "imageWidth": imageWidth,
                    "imageDuration": imageDuration,
                    "enterAnimation": data.enterAnimation,
                    "exitAnimation": data.exitAnimation,
                    "overlayInstance": data.overlayInstance,
                    "customCoords": data.customCoords
                };

                service.broadcast(broadCastData);
            }

            function showVideo(data) {
                let videoType = data.videoType;
                let filepath = data.filepath;
                let youtubeId = data.youtubeId;
                let videoPosition = data.videoPosition;
                let videoHeight = data.videoHeight;
                let videoWidth = data.videoWidth;
                let videoDuration = parseFloat(data.videoDuration);
                let videoVolume = data.videoVolume;
                let videoStarttime = data.videoStarttime;

                // Set defaults if they werent filled out.
                if (videoPosition === "" || videoPosition == null) {
                    videoPosition = "Top Middle";
                }
                if (videoHeight === "" || videoHeight == null) {
                    videoHeight = false;
                }
                if (videoWidth === "" || videoWidth == null) {
                    videoWidth = false;
                }
                if (videoDuration === null || videoDuration === undefined || isNaN(videoDuration)) {
                    videoDuration = 5;
                }

                // Compile data and send to overlay.
                let broadcastdata = {
                    "event": "video",
                    "videoType": videoType,
                    "filepath": filepath,
                    "resourceToken": data.resourceToken,
                    "youtubeId": youtubeId,
                    "videoPosition": videoPosition,
                    "videoHeight": videoHeight,
                    "videoWidth": videoWidth,
                    "videoDuration": videoDuration,
                    "videoVolume": videoVolume,
                    "videoStarttime": videoStarttime,
                    "enterAnimation": data.enterAnimation,
                    "exitAnimation": data.exitAnimation,
                    "overlayInstance": data.overlayInstance,
                    "customCoords": data.customCoords,
                    "loop": data.loop
                };

                service.broadcast(broadcastdata);
            }

            // Shows Text
            // This function takes info given from the main process and then sends a request to the overlay to render it.
            function showText(data) {
                data.event = "text";
                logger.debug("Recieved show text effect from backend, sending to overlay");
                service.broadcast(data);
            }

            // Shows HTML
            // This function takes info given from the main process and then sends a request to the overlay to render it.
            function showHtml(data) {
                data.event = "html";

                service.broadcast(data);
            }

            // Websocket Server
            // This allows for the guiBroadcast call to send out data via websocket.
            service.broadcast = function(data) {
                data = JSON.stringify(data);
                wss.clients.forEach(function each(client) {
                    if (client.readyState === 1) {
                        client.send(data, (err) => {
                            if (err) {
                                logger.error(err);
                            }
                        });
                    }
                });
            };

            service.hasClientsConnected = false;

            wss.on('connection', function connection() {
                service.hasClientsConnected = true;
                $timeout(() => {
                    $rootScope.$broadcast("connection:update", { type: "overlay", status: "connected" });
                });
            });

            $interval(() => {
                let prevValue = service.hasClientsConnected === true;
                let hasConnectedClients = wss.clients.size > 0;
                if (hasConnectedClients !== prevValue) {
                    service.hasClientsConnected = hasConnectedClients;
                    let status = service.hasClientsConnected ? "connected" : "warning";
                    $rootScope.$broadcast("connection:update", { type: "overlay", status: status });
                }
            }, 1500);

            // Watches for an event from main process
            listenerService.registerListener(
                { type: listenerService.ListenerType.SHOW_EVENTS },
                (data) => {
                    showEvents(data);
                });

            listenerService.registerListener(
                { type: listenerService.ListenerType.SHOW_VIDEO },
                (data) => {
                    showVideo(data);
                });

            listenerService.registerListener(
                { type: listenerService.ListenerType.SHOW_IMAGE },
                (data) => {
                    showImage(data);
                });

            /*listenerService.registerListener(
                { type: listenerService.ListenerType.API_BUTTON },
                (data) => {
                    showImage(data);
                });*/

            listenerService.registerListener(
                { type: listenerService.ListenerType.SHOW_HTML },
                (data) => {
                    showHtml(data);
                });

            listenerService.registerListener(
                { type: listenerService.ListenerType.SHOW_TEXT },
                (data) => {
                    showText(data);
                });

            listenerService.registerListener(
                { type: listenerService.ListenerType.CELEBREATE },
                (data) => {
                    service.broadcast(data);
                });

            listenerService.registerListener(
                { type: listenerService.ListenerType.CLEAR_EFFECTS },
                () => {
                    logger.info("Refreshing overlay...");
                    service.broadcast({ event: "firebot:reloadoverlay" });
                });

            return service;
        });
}());
