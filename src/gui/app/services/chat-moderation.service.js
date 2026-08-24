"use strict";

/** @import { ChatModerationSettings, ModerationTerm, ModerationImportRequest } from "../../../types" */

(function() {
    angular
        .module("firebotApp")
        .factory("chatModerationService", function(backendCommunicator) {
            const service = {};

            service.chatModerationData = {
                /** @type {ChatModerationSettings} */
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

                /** @type {ModerationTerm[]} */
                bannedWords: [],

                /** @type {ModerationTerm[]} */
                bannedRegularExpressions: [],

                /** @type {ModerationTerm[]} */
                urlAllowlist: [],

                /** @type {ModerationTerm[]} */
                userAllowlist: []
            };

            backendCommunicator.onAsync("chat-moderation:settings-updated", async (moderationData) => {
                service.chatModerationData = moderationData ?? {};
            });

            service.saveChatModerationSettings = () => {
                backendCommunicator.send("chat-moderation:update-chat-moderation-settings", service.chatModerationData.settings);
            };

            service.addBannedWords = (words) => {
                const normalizedWords = words
                    .filter(w => w != null && w.trim().length > 0 && w.trim().length < 360)
                    .map(w => w.trim().toLowerCase());

                backendCommunicator.send("chat-moderation:add-banned-words", normalizedWords);
            };

            service.addBannedRegex = (text) => {
                backendCommunicator.send("chat-moderation:add-banned-regular-expression", text);
            };

            service.removeBannedWordByText = (text) => {
                backendCommunicator.send("chat-moderation:remove-banned-word", text);
            };

            service.removeAllBannedWords = () => {
                backendCommunicator.send("chat-moderation:remove-all-banned-words");
            };

            /** @param {ModerationImportRequest} request */
            service.importBannedWords = async (request) => {
                return await backendCommunicator.fireEventAsync("chat-moderation:import-banned-words", request);
            };

            service.removeRegex = (text) => {
                backendCommunicator.send("chat-moderation:remove-banned-regular-expression", text);
            };

            service.removeAllBannedRegularExpressions = () => {
                backendCommunicator.send("chat-moderation:remove-all-banned-regular-expressions");
            };

            service.addAllowedUrls = (urls) => {
                const normalizedUrls = urls
                    .filter(u => u != null && u.trim().length > 0 && u.trim().length < 360)
                    .map(u => u.trim().toLowerCase());

                backendCommunicator.send("chat-moderation:add-allowed-urls", normalizedUrls);
            };

            service.removeAllowedUrlByText = (text) => {
                backendCommunicator.send("chat-moderation:remove-allowed-url", text);
            };

            service.removeAllAllowedUrls = () => {
                backendCommunicator.send("chat-moderation:remove-all-allowed-urls");
            };

            /** @param {ModerationImportRequest} request */
            service.importUrlAllowlist = async (request) => {
                return await backendCommunicator.fireEventAsync("chat-moderation:import-url-allowlist", request);
            };

            service.addAllowedUser = (user) => {
                backendCommunicator.send("chat-moderation:add-allowed-user", { id: user.id, username: user.username, displayName: user.displayName });
            };

            service.removeAllowedUserById = (id) => {
                backendCommunicator.send("chat-moderation:remove-allowed-user", id);
            };

            service.removeAllAllowedUsers = () => {
                backendCommunicator.send("chat-moderation:remove-all-allowed-users");
            };

            service.registerPermitCommand = () => {
                backendCommunicator.send("registerPermitCommand");
            };

            service.unregisterPermitCommand = () => {
                backendCommunicator.send("unregisterPermitCommand");
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

            backendCommunicator.send("chat-moderation:ui-service-ready");

            return service;
        });
}());