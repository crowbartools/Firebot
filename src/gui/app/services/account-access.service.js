"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("accountAccess", function(connectionService, backendCommunicator, utilityService) {
            const service = {};

            service.accounts = {
                streamer: {
                    username: "Streamer",
                    loggedIn: false,
                    broadcasterType: ""
                },
                bot: {
                    username: "Bot",
                    loggedIn: false
                }
            };

            // Login Kickoff
            service.loginOrLogout = function(type) {
                if (type === "streamer") {
                    if (service.accounts.streamer.loggedIn) {
                        service.logout(type);
                    } else {
                        utilityService.showModal({
                            component: "twitchDcfModal",
                            resolveObj: {
                                accountType: () => type
                            },
                            closeCallback: () => {
                                backendCommunicator.send("cancel-device-token-check");
                            }
                        });
                    }
                } else if (type === "bot") {
                    if (service.accounts.bot.loggedIn) {
                        service.logout(type);
                    } else {
                        utilityService.showModal({
                            component: "twitchDcfModal",
                            resolveObj: {
                                accountType: () => type
                            },
                            closeCallback: () => {
                                backendCommunicator.send("cancel-device-token-check");
                            }
                        });
                    }
                }
            };

            service.logout = (type) => {
                if (type !== "streamer" && type !== "bot") {
                    return;
                }

                if (service.accounts[type].loggedIn) {
                    service.logoutAccount(type);
                }
            };

            service.invalidateAccounts = (invalidAccounts) => {
                if (!invalidAccounts.streamer && !invalidAccounts.bot) {
                    return;
                }

                connectionService.disconnectFromService("chat");

                if (invalidAccounts.streamer) {
                    service.logout("streamer");
                }

                if (invalidAccounts.bot) {
                    service.logout("bot");
                }

                utilityService.showModal({
                    component: "loginsModal",
                    resolveObj: {
                        invalidAccounts: () => invalidAccounts
                    }
                });
            };

            backendCommunicator.on("accounts:invalidate-accounts", service.invalidateAccounts);

            service.validateAccounts = () => {
                backendCommunicator.send("validate-twitch-accounts");
            };

            service.logoutAccount = (accountType) => {
                backendCommunicator.send("accounts:logout-account", accountType);
            };

            const defaultPhotoUrl = "../images/placeholders/nologin.png";

            service.getAccountAvatar = function(type) {
                if (type !== "streamer" && type !== "bot" && service.accounts[type] != null) {
                    return defaultPhotoUrl;
                }

                return service.accounts[type].avatar || defaultPhotoUrl;
            };

            backendCommunicator.on("accounts:account-update", (accounts) => {
                service.accounts = accounts;
            });

            backendCommunicator.send("accounts:ui-service-ready");

            return service;
        });
}());
