"use strict";

/**
 * @typedef SortTag
 * @property {string} id
 * @property {string} name
 */

(function() {

    angular
        .module("firebotApp")
        .factory("sortTagsService", function(utilityService, backendCommunicator) {
            const service = {};

            /**
             * @type {Record<string, SortTag[]>}
             */
            let sortTags = {};

            /**
             * @type {Record<string, SortTag>}
             */
            const selectedSortTags = {};

            service.loadSortTags = () => {
                sortTags = backendCommunicator.fireEventSync("sort-tags:get-sort-tags");
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
             * @returns {SortTag[]}
             */
            service.getSortTagsForItem = (context, tagIds) => {
                if (context == null || tagIds == null) {
                    return [];
                }
                return service.getSortTags(context)
                    .filter(st => tagIds.includes(st.id));
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
                    closeCallback: (tags) => {
                        backendCommunicator.send("sort-tags:save-sort-tags", {
                            context,
                            sortTags: tags
                        });
                    }
                });
            };

            /** @param {string} context */
            service.getSelectedSortTag = context => selectedSortTags[context];

            /** @param {string} context */
            service.getSelectedSortTagDisplay = context => (
                selectedSortTags[context] != null
                    ? selectedSortTags[context].name
                    : `All ${context}`
            );

            /**
             * @param {string} context
             * @param {SortTag} tag
             */
            service.setSelectedSortTag = (context, tag) => {
                selectedSortTags[context] = tag;
            };

            backendCommunicator.on("sort-tags:updated-sort-tags", (updatedSortTags) => {
                sortTags = updatedSortTags;
            });

            return service;
        });
}());