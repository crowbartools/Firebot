"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("chatModerationService", function(backendCommunicator) {
            const service = {};

            service.chatModerationData = {
                /** @type {import("../../../backend/chat/moderation/chat-moderation-manager").ChatModerationSettings} */
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

                /** @type {import("../../../backend/chat/moderation/chat-moderation-manager").ModerationTerm[]} */
                bannedWords: [],

                /** @type {import("../../../backend/chat/moderation/chat-moderation-manager").ModerationTerm[]} */
                bannedRegularExpressions: [],

                /** @type {import("../../../backend/chat/moderation/chat-moderation-manager").ModerationTerm[]} */
                urlAllowlist: [],

                /** @type {import("../../../backend/chat/moderation/chat-moderation-manager").ModerationTerm[]} */
                userAllowlist: []
            };

            service.loadChatModerationData = () => {
                const data = backendCommunicator.fireEventSync("chat-moderation:get-chat-moderation-data");
                if (data != null) {
                    service.chatModerationData = data;
                }
            };

            service.saveChatModerationSettings = () => {
                backendCommunicator.fireEvent("chat-moderation:update-chat-moderation-settings", service.chatModerationData.settings);
            };

            service.addBannedWords = (words) => {
                const normalizedWords = words
                    .filter(w => w != null && w.trim().length > 0 && w.trim().length < 360)
                    .map(w => w.trim().toLowerCase());

                backendCommunicator.send("chat-moderation:add-banned-words", normalizedWords);
            };

            service.addBannedRegex = (text) => {
                backendCommunicator.fireEvent("chat-moderation:add-banned-regular-expression", text);
            };

            service.removeBannedWordByText = (text) => {
                backendCommunicator.send("chat-moderation:remove-banned-word", text);
            };

            service.removeAllBannedWords = () => {
                backendCommunicator.send("chat-moderation:remove-all-banned-words");
            };

            /** @param {import("../../../backend/chat/moderation/chat-moderation-manager").BannedWordImportRequest} request */
            service.importBannedWords = async (request) => {
                return await backendCommunicator.fireEventAsync("chat-moderation:import-banned-words", request);
            };

            service.removeRegex = (text) => {
                backendCommunicator.fireEvent("chat-moderation:remove-banned-regular-expression", text);
            };

            service.removeAllBannedRegularExpressions = () => {
                backendCommunicator.fireEvent("chat-moderation:remove-all-banned-regular-expressions");
            };

            service.addAllowedUrls = (urls) => {
                const normalizedUrls = urls
                    .filter(u => u != null && u.trim().length > 0 && u.trim().length < 360)
                    .map(u => u.trim().toLowerCase());

                backendCommunicator.fireEvent("chat-moderation:add-allowed-urls", normalizedUrls);
            };

            service.removeAllowedUrlByText = (text) => {
                backendCommunicator.fireEvent("chat-moderation:remove-allowed-url", text);
            };

            service.removeAllAllowedUrls = () => {
                backendCommunicator.fireEvent("chat-moderation:remove-all-allowed-urls");
            };

            /** @param {import("../../../backend/chat/moderation/chat-moderation-manager").BannedWordImportRequest} request */
            service.importUrlAllowlist = async (request) => {
                return await backendCommunicator.fireEventAsync("chat-moderation:import-url-allowlist", request);
            };

            service.addAllowedUser = (user) => {
                backendCommunicator.fireEvent("chat-moderation:add-allowed-user", { id: user.id, username: user.username, displayName: user.displayName });
            };

            service.removeAllowedUserById= (id) => {
                backendCommunicator.fireEvent("chat-moderation:remove-allowed-user", id);
            };

            service.removeAllAllowedUsers = () => {
                backendCommunicator.fireEvent("chat-moderation:remove-all-allowed-users");
            };

            service.registerPermitCommand = () => {
                backendCommunicator.fireEvent("registerPermitCommand");
            };

            service.unregisterPermitCommand = () => {
                backendCommunicator.fireEvent("unregisterPermitCommand");
            };

            backendCommunicator.on("chat-moderation:chat-moderation-settings-updated", (settings) => {
                service.chatModerationData.settings = settings;
            });

            backendCommunicator.on("chat-moderation:banned-word-list-updated", (terms) => {
                service.chatModerationData.bannedWords = terms;
            });

            backendCommunicator.on("chat-moderation:banned-regex-list-updated", (terms) => {
                service.chatModerationData.bannedRegularExpressions = terms;
            });

            backendCommunicator.on("chat-moderation:url-allowlist-updated", (urls) => {
                service.chatModerationData.urlAllowlist = urls;
            });

            backendCommunicator.on("chat-moderation:user-allowlist-updated", (users) => {
                service.chatModerationData.userAllowlist = users;
            });

            return service;
        });
}());