'use strict';

(function() {

    const WebSocket = require('ws');
    const WebSocketServer = WebSocket.Server;

    // This provides methods for sending stuff to the websocket

    angular
        .module('firebotApp')
        .factory('websocketService', function (listenerService, settingsService) {
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
                let showEventsDuration = parseInt(data.showEventsDuration);
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
                let filepath = data.filepath;
                let imagePosition = data.imagePosition;
                let imageHeight = data.imageHeight;
                let imageWidth = data.imageWidth;
                let imageDuration = parseInt(data.imageDuration);

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
                let videoDuration = parseInt(data.videoDuration);
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
                    "customCoords": data.customCoords
                };

                service.broadcast(broadcastdata);
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
                console.log(data);
                wss.clients.forEach(function each(client) {
                    client.send(data);
                });
            };

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

            // Watches for an event from main process
            listenerService.registerListener(
                { type: listenerService.ListenerType.SHOW_IMAGE },
                (data) => {
                    showImage(data);
                });

            // Watches for an event from main process
            listenerService.registerListener(
                { type: listenerService.ListenerType.API_BUTTON },
                (data) => {
                    showImage(data);
                });

            // Watches for an event from main process
            listenerService.registerListener(
                { type: listenerService.ListenerType.SHOW_HTML },
                (data) => {
                    showHtml(data);
                });

            // Watches for an event from main process
            listenerService.registerListener(
                { type: listenerService.ListenerType.CELEBREATE },
                (data) => {
                    service.broadcast(data);
                });

            return service;
        });
}());
