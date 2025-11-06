"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("accountAccess", function(backendCommunicator) {
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

            service.loadAccounts = () => {
                service.accounts = backendCommunicator.fireEventSync("accounts:get-accounts");
            };
            service.loadAccounts();

            service.logoutAccount = (accountType) => {
                backendCommunicator.fireEvent("accounts:logout-account", accountType);
            };

            backendCommunicator.on("accounts:account-update", (accounts) => {
                service.accounts = accounts;
            });

            return service;
        });
}());
