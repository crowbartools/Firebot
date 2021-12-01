"use strict";

/**
 * @typedef SortTag
 * @property {string} id
 * @property {string} name
 */

(function() {

    angular
        .module("firebotApp")
        .factory("sortTagsService", function(logger, profileManager,
            utilityService, settingsService, backendCommunicator) {
            let service = {};

            /**
             * @type {Object.<string, SortTag[]>}
             */
            let sortTags = {};

            /**
             * @type {Record<string,SortTag>}
             */
            const selectedSortTags = {};

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

                service.getLegacyEventAndCommandTags();
            };

            /**
             * @param {string} context
             * @returns {SortTag[]}
             */
            service.getSortTags = (context) => {
                if (sortTags[context] == null) {
                    sortTags[context] = [];
                }
                return sortTags[context];
            };

            backendCommunicator.onAsync("get-sort-tags", async (context) => {
                return service.getSortTags(context);
            });

            /**
             * @param {string} context
             * @param {string[]} tagIds
             * @returns {string[]}
             */
            service.getSortTagNames = (context, tagIds) => {
                if (context == null || tagIds == null) {
                    return [];
                }
                return service.getSortTags(context)
                    .filter(st => tagIds.includes(st.id)).map(st => st.name);
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

            /** @param {SortTag} context */
            service.getSelectedSortTag = (context) => selectedSortTags[context];

            /** @param {string} context */
            // eslint-disable-next-line no-confusing-arrow
            service.getSelectedSortTagDisplay = (context) => (selectedSortTags[context] != null ? selectedSortTags[context].name : `All ${context}`);

            /**
             * @param {string} context
             * @param {SortTag} tag
             */
            service.setSelectedSortTag = (context, tag) => {
                selectedSortTags[context] = tag;
            };

            /**
             * This asks the backend to give us any old event and/or command tags that need to be
             * imported into the new model
             */
            service.getLegacyEventAndCommandTags = () => {

                if (!settingsService.legacySortTagsImported()) {

                    settingsService.setLegacySortTagsImported(true);

                    /**@type {Object.<string, SortTag[]>} */
                    const legacySortTags = {
                        commands: [],
                        events: []
                    };

                    try {
                        const commandsDb = profileManager.getJsonDbInProfile("/chat/commands");

                        legacySortTags.commands = commandsDb.getData("/sortTags");

                        commandsDb.delete("/sortTags");
                    } catch (err) {
                        // silently fail
                    }

                    try {
                        const eventsDb = profileManager.getJsonDbInProfile("/events/events");

                        legacySortTags.events = eventsDb.getData("/sortTags");

                        eventsDb.delete("/sortTags");
                    } catch (err) {
                        // silently fail
                    }

                    Object.keys(legacySortTags).forEach(context => {

                        if (sortTags[context] == null) {
                            sortTags[context] = [];
                        }

                        const tags = legacySortTags[context]
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
            };

            return service;
        });
}());