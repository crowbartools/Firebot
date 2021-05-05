"use strict";

/**
 * @typedef SortTag
 * @property {string} id
 * @property {string} name
 */

(function() {


    angular
        .module("firebotApp")
        .factory("quotesService", function(logger, profileManager, backendCommunicator,
            utilityService, $q) {
            let service = {};

            /**
             * @type {Object.<string, SortTag[]>}
             */
            let sortTags = {};

            function getSortTagsDb() {
                return profileManager
                    .getJsonDbInProfile("sort-tags");
            }

            function saveAllSortTags() {
                try {
                    getSortTagsDb().push("/", sortTags);

                    logger.debug(`Saved sort tags.`);
                } catch (err) {
                    logger.warn(`There was an error saving sort tags.`, err);
                }
            }

            service.loadSortTags = () => {
                logger.debug(`Attempting to load sort tags...`);

                try {
                    const sortTagsData = getSortTagsDb().getData("/");

                    if (sortTagsData) {
                        sortTags = sortTagsData;
                    }

                    logger.debug(`Loaded sort tags.`);
                } catch (err) {
                    logger.warn(`There was an error reading sort tags file.`, err);
                }
            };

            /**
             * @param {string} context
             * @returns SortTag[]
             */
            service.getSortTags = (context) => {
                if (sortTags[context] == null) {
                    sortTags[context] = [];
                }
                return sortTags[context];
            };

            /**
             * @param {string} context
             */
            service.showEditSortTagsModal = (context) => {
                const sortTagsForContext = service.getSortTags(context);
                utilityService.showModal({
                    component: "manageSortTagsModal",
                    size: "sm",
                    resolveObj: {
                        tags: () => sortTagsForContext
                    },
                    closeCallback: tags => {
                        sortTags[context] = tags;
                        saveAllSortTags();
                    }
                });
                saveAllSortTags();
            };

            /**
             * This asks the backend to give us any old event and/or command tags that need to be
             * imported into the new model
             */
            service.getLegacyEventAndCommandTags = () => {
                $q.when(backendCommunicator.fireEventAsync("getLegacyEventAndCommandTags"))
                    .then((/**@type {Object.<string, SortTag[]>} */ legacyTags) => {
                        if (legacyTags != null) {


                            Object.keys(legacyTags).forEach(context => {

                                if (sortTags[context] == null) {
                                    sortTags[context] = [];
                                }

                                const tags = legacyTags[context]
                                    .filter(t => sortTags[context].every(st => st.id !== t.id));

                                if (tags.length > 0) {
                                    sortTags[context] = [
                                        ...sortTags[context],
                                        ...tags
                                    ];
                                }
                            });

                            saveAllSortTags();
                        }
                    });
            };

            return service;
        });
}());