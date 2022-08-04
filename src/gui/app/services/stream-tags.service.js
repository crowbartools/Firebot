"use strict";
(function() {

    angular
        .module("firebotApp")
        .factory("streamTagsService", function(backendCommunicator) {
            const service = {};

            service.allStreamTags = [];

            service.loadAllStreamTags = async () => {
                const streamTags = await backendCommunicator.fireEventAsync("get-all-stream-tags");

                if (streamTags) {
                    service.allStreamTags = streamTags;
                }
            };

            return service;
        });
}());
