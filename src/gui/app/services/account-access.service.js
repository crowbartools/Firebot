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

            service.getAccounts = () => {
                service.accounts = backendCommunicator.fireEventSync("getAccounts");
            };
            service.getAccounts();

            service.logoutAccount = (accountType) => {
                backendCommunicator.fireEvent("logoutAccount", accountType);
            };

            backendCommunicator.on("accountUpdate", accounts => {
                service.accounts = accounts;
            });

            return service;
        });
}());
