"use strict";

(function() {
    const emojiData = require("unicode-emoji-json");

    angular
        .module("firebotApp")
        .factory("emojiService", function() {
            const service = {};

            let cachedEmojis = null;

            service.getEmojis = () => {
                if (cachedEmojis != null) {
                    return cachedEmojis;
                }
                cachedEmojis = Object.keys(emojiData).map((emoji) => {
                    const data = emojiData[emoji];
                    return {
                        id: emoji,
                        emoji: emoji,
                        name: data.name,
                        group: data.group
                    };
                });
                return cachedEmojis;
            };

            service.getName = (emoji) => {
                const data = emojiData[emoji];
                return data ? data.name : "";
            };

            return service;
        });
}());
