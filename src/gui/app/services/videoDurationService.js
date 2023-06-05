"use strict";

(function() {

    const uuid = require("uuid");

    // This provides methods for playing sounds

    angular
        .module("firebotApp")
        .factory("videoService", function(backendCommunicator) {
            const service = {};

            service.getVideoMetadata = function (path) {
                return new Promise((resolve) => {
                    const id = "videometadata-" + uuid();
                    const videoElement = `<video id="${id}" preload="metadata" style="display: none;"></video>`;
                    $(document.documentElement).append(videoElement);
                    const video = document.getElementById(id);
                    video.onloadedmetadata = () => {
                        const result = {
                            success: true,
                            duration: video.duration,
                            height: video.videoHeight,
                            width: video.videoWidth
                        };
                        video.remove();
                        resolve(result);
                    };

                    video.onerror = () => {
                        const result = {
                            success: false,
                            error: video.error.message,
                            path: video.src
                        };
                        video.remove();
                        resolve(result);
                    };

                    video.src = path;
                });
            };

            backendCommunicator.onAsync("getVideoMetadata", async (data) => {
                return await service.getVideoMetadata(data.path);
            });

            return service;
        });
}(window.angular));
