"use strict";

(function() {

    const { v4: uuid } = require("uuid");

    // This provides methods for playing sounds

    angular
        .module("firebotApp")
        .factory("videoService", function(backendCommunicator) {
            const service = {};

            service.getVideoDuration = function (path) {
                return new Promise((resolve) => {
                    const id = `video-${uuid()}`;
                    const videoElement = `<video id="${id}" preload="metadata" style="display: none;"></video>`;
                    $(document.documentElement).append(videoElement);
                    const video = document.getElementById(id);
                    video.onloadedmetadata = () => {
                        resolve(video.duration);
                        video.remove();
                    };

                    video.onerror = () => {
                        const result = {
                            error: video.error.message,
                            path: video.src
                        };
                        video.remove();
                        resolve(result);
                    };

                    video.src = path;
                });
            };

            backendCommunicator.onAsync("getVideoDuration", async (path) => {
                return await service.getVideoDuration(path);
            });

            return service;
        });
}(window.angular));
