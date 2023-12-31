"use strict";

(function() {

    const moment = require("moment");

    angular
        .module("firebotApp")
        .factory("chatModerationService", function(backendCommunicator) {
            const service = {};

            service.chatModerationData = {
                settings: {
                    bannedWordList: {
                        enabled: false,
                        exemptRoles: [],
                        outputMessage: ""
                    },
                    emoteLimit: {
                        enabled: false,
                        exemptRoles: [],
                        max: 10,
                        outputMessage: ""
                    },
                    urlModeration: {
                        enabled: false,
                        exemptRoles: [],
                        viewTime: {
                            enabled: false,
                            viewTimeInHours: 0
                        },
                        outputMessage: ""
                    },
                    exemptRoles: []
                },
                bannedWords: [],
                bannedRegularExpressions: [],
                urlAllowlist: []
            };

            service.loadChatModerationData = () => {
                const data = backendCommunicator.fireEventSync("getChatModerationData");
                if (data != null) {
                    service.chatModerationData = data;
                    if (service.chatModerationData.settings.exemptRoles == null) {
                        service.chatModerationData.settings.exemptRoles = [];
                    }

                    if (service.chatModerationData.settings.bannedWordList.exemptRoles == null) {
                        service.chatModerationData.settings.bannedWordList.exemptRoles = [];
                    }

                    if (service.chatModerationData.settings.bannedWordList.outputMessage == null) {
                        service.chatModerationData.settings.bannedWordList.outputMessage = "";
                    }

                    if (service.chatModerationData.settings.emoteLimit == null) {
                        service.chatModerationData.settings.emoteLimit = {
                            enabled: false,
                            exemptRoles: [],
                            max: 10,
                            outputMessage: ""
                        };
                    }
                    if (service.chatModerationData.settings.emoteLimit.exemptRoles == null) {
                        service.chatModerationData.settings.emoteLimit.exemptRoles = [];
                    }

                    if (service.chatModerationData.settings.emoteLimit.outputMessage == null) {
                        service.chatModerationData.settings.emoteLimit.outputMessage = "";
                    }

                    if (service.chatModerationData.settings.urlModeration.exemptRoles == null) {
                        service.chatModerationData.settings.urlModeration.exemptRoles = [];
                    }

                    if (service.chatModerationData.urlAllowlist == null) {
                        service.chatModerationData.urlAllowlist = [];
                    }
                }
            };

            service.saveChatModerationSettings = () => {
                backendCommunicator.fireEvent("chatMessageSettingsUpdate", service.chatModerationData.settings);
            };

            service.addBannedWords = (words) => {

                const normalizedWords = words
                    .filter(w => w != null && w.trim().length > 0 && w.trim().length < 360)
                    .map(w => w.trim().toLowerCase());

                const mapped = [...new Set(normalizedWords)].map(w => {
                    return {
                        text: w,
                        createdAt: moment().valueOf()
                    };
                });

                service.chatModerationData.bannedWords = service.chatModerationData.bannedWords.concat(mapped);

                backendCommunicator.fireEvent("addBannedWords", mapped);
            };

            service.addBannedRegex = (text) => {
                const mapped = {
                    text,
                    createdAt: moment().valueOf()
                };

                service.chatModerationData.bannedRegularExpressions.push(mapped);

                backendCommunicator.fireEvent("addBannedRegularExpression", mapped);
            };

            service.removeBannedWordAtIndex = (index) => {
                const word = service.chatModerationData.bannedWords[index];
                if (word) {
                    backendCommunicator.fireEvent("removeBannedWord", word.text);
                    service.chatModerationData.bannedWords.splice(index, 1);
                }
            };

            service.removeBannedWordByText = (text) => {
                const index = service.chatModerationData.bannedWords.findIndex(w => w.text === text);
                if (index > -1) {
                    service.removeBannedWordAtIndex(index);
                }
            };

            service.removeAllBannedWords = () => {
                service.chatModerationData.bannedWords = [];
                backendCommunicator.fireEvent("removeAllBannedWords");
            };

            service.removeRegexAtIndex = (index) => {
                const regex = service.chatModerationData.bannedRegularExpressions[index];
                if (regex) {
                    backendCommunicator.fireEvent("removeBannedRegularExpression", regex);
                    service.chatModerationData.bannedRegularExpressions.splice(index, 1);
                }
            };

            service.removeRegex = (text) => {
                const index = service.chatModerationData.bannedRegularExpressions.findIndex(r => r.text === text);
                if (index > -1) {
                    service.removeRegexAtIndex(index);
                }
            };

            service.removeAllBannedRegularExpressions = () => {
                service.chatModerationData.bannedRegularExpressions = [];
                backendCommunicator.fireEvent("removeAllBannedRegularExpressions");
            };

            service.addAllowedUrls = (urls) => {
                const normalizedUrls = urls
                    .filter(u => u != null && u.trim().length > 0 && u.trim().length < 360)
                    .map(u => u.trim().toLowerCase());

                const mapped = [...new Set(normalizedUrls)].map(u => {
                    return {
                        text: u,
                        createdAt: moment().valueOf()
                    };
                });

                service.chatModerationData.urlAllowlist =
                    service.chatModerationData.urlAllowlist.concat(mapped);

                backendCommunicator.fireEvent("addAllowedUrls", mapped);
            };

            service.removeAllowedUrlAtIndex = (index) => {
                const word = service.chatModerationData.urlAllowlist[index];
                if (word) {
                    backendCommunicator.fireEvent("removeAllowedUrl", word.text);
                    service.chatModerationData.urlAllowlist.splice(index, 1);
                }
            };

            service.removeAllowedUrlByText = (text) => {
                const index = service.chatModerationData.urlAllowlist.findIndex(u => u.text === text);
                if (index > -1) {
                    service.removeAllowedUrlAtIndex(index);
                }
            };

            service.removeAllAllowedUrls = () => {
                service.chatModerationData.urlAllowlist = [];
                backendCommunicator.fireEvent("removeAllAllowedUrls");
            };

            service.registerPermitCommand = () => {
                backendCommunicator.fireEvent("registerPermitCommand");
            };

            service.unregisterPermitCommand = () => {
                backendCommunicator.fireEvent("unregisterPermitCommand");
            };

            return service;
        });
}());
