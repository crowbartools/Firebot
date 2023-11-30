"use strict";

(function() {

    const uuid = require("uuid");

    // This provides methods for playing sounds

    angular
        .module("firebotApp")
        .factory("videoService", function(backendCommunicator) {
            const service = {};

            service.getVideoDuration = function (path) {
                return new Promise((resolve) => {
                    const id = "video-" + uuid();
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

            service.getYoutubeVideoDuration = function (videoId) {
                return new Promise((resolve) => {
                    const id = "video-" + uuid();
                    $(document.documentElement).append(`<div id="${id}" style="display: none;"></div>`);
                    // eslint-disable-next-line no-undef
                    const player = new YT.Player(id, {
                        videoId: videoId,
                        events: {
                            onReady: (event) => {
                                event.target.setVolume(0);
                                event.target.playVideo();
                                if (player.getDuration() === 0) {
                                    return;
                                }
                                resolve(player.getDuration());
                                document.getElementById(id).remove();
                            },
                            onError: (event) => {
                                const error = {
                                    code: event.data,
                                    youtubeId: videoId
                                };
                                if (event.data === "2") {
                                    error.error = "The request contains an invalid parameter value.";
                                }
                                if (event.data === "5") {
                                    error.error = "The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.";
                                }
                                if (event.data === "100") {
                                    error.error = "The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.";
                                }
                                if (event.data === "101" || event.data === "150") {
                                    error.error = "The owner of the requested video does not allow it to be played in embedded players.";
                                }
                                resolve(error);
                                document.getElementById(id).remove();
                            }
                        }
                    });
                });
            };

            backendCommunicator.onAsync("getVideoDuration", async (path) => {
                return await service.getVideoDuration(path);
            });

            backendCommunicator.onAsync("getYoutubeVideoDuration", async (youtubeId) => {
                return await service.getYoutubeVideoDuration(youtubeId);
            });

            return service;
        });
}(window.angular));
