"use strict";
(function() {

    angular
        .module("firebotApp")
        .factory("pronounsService", function(logger, $rootScope, $http) {
            const service = {};

            /**
             * @typedef Pronoun
             * @property {string} name
             * @property {string} display
             */

            /** @type {Pronoun[]} */
            let pronouns = [];

            service.pronounCache = {};

            service.userHasPronoun = (username) => service.pronounCache[username] != null;

            service.getUserPronoun = (username) => {
                if (username == null) {
                    return null;
                }

                if (service.pronounCache[username]) {
                    return service.pronounCache[username];
                }

                $http.get(`https://pronouns.alejo.io/api/users/${username}`)
                    .then(resp => {
                        if (resp.status === 200) {
                            const userPronounData = resp.data[0];
                            if (userPronounData == null) {
                                return;
                            }

                            const pronoun = pronouns.find(p => p.name
                                === userPronounData.pronoun_id);
                            if (pronoun != null) {
                                service.pronounCache[username] = pronoun.display;
                            }
                        } else {
                            logger.error(`Failed to get pronoun for ${username}`);
                        }
                    }, (error) => {
                        logger.error(`Failed to get retrieve pronoun for ${username}`, error.message);
                    });

                return null;
            };

            service.retrieveAllPronouns = () => {
                service.pronounCache = {};

                $http.get('https://pronouns.alejo.io/api/pronouns')
                    .then(resp => {
                        if (resp.status === 200) {
                            pronouns = resp.data;
                        } else {
                            logger.error("Failed to get pronouns list", resp);
                        }
                    }, (error) => {
                        logger.error("Failed to get pronouns:", error.message);
                    });
            };

            $rootScope.$on("connection:update", (_, { type, status }) => {
                if (type === "chat" && status === "connected") {
                    service.retrieveAllPronouns();
                }
            });


            return service;
        });
}());
