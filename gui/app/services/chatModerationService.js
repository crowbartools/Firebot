"use strict";

(function() {

    const moment = require("moment");

    angular
        .module("firebotApp")
        .factory("chatModerationService", function(backendCommunicator) {
            let service = {};

            service.chatModerationData = {
                settings: {
                    bannedWordList: {
                        enabled: false,
                        exemptRoles: []
                    }
                },
                bannedWords: []
            };

            service.loadChatModerationData = () => {
                let data = backendCommunicator.fireEventSync("getChatModerationData");
                if (data != null) {
                    service.chatModerationData = data;
                }
            };

            service.saveChatModerationSettings = () => {
                backendCommunicator.fireEvent("chatMessageSettingsUpdate", service.chatModerationData.settings);
            };

            service.addBannedWords = (words) => {

                let normalizedWords = words
                    .filter(w => w != null && w.trim().length > 0 && w.trim().length < 360)
                    .map(w => w.trim().toLowerCase());

                let mapped = [...new Set(normalizedWords)].map(w => {
                    return {
                        text: w,
                        createdAt: moment().valueOf()
                    };
                });

                service.chatModerationData.bannedWords = service.chatModerationData.bannedWords.concat(mapped);

                backendCommunicator.fireEvent("addBannedWords", mapped);
            };

            service.removeBannedWordAtIndex = (index) => {
                let word = service.chatModerationData.bannedWords[index];
                if (word) {
                    backendCommunicator.fireEvent("removeBannedWord", word.text);
                    service.chatModerationData.bannedWords.splice(index, 1);
                }
            };

            service.removeBannedWordByText = (text) => {
                let index = service.chatModerationData.bannedWords.findIndex(w => w.text === text);
                if (index > -1) {
                    service.removeBannedWordAtIndex(index);
                }
            };

            service.removeAllBannedWords = () => {
                service.chatModerationData.bannedWords = [];
                backendCommunicator.fireEvent("removeAllBannedWords");
            };

            return service;
        });
}());
