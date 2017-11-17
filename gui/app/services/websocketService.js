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

            // This allows the websocket server to accept incoming packets from overlay.
            wss.on('connection', function connection(ws) {
                ws.on('message', function incoming(message) {
                    message = JSON.parse(message);
                    // TO DO: This would be where you'd watch for events shown in the GUI to end.
                });
            });

            // Watches for an event from main process
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
