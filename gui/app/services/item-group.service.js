"use strict";

/**
 * @typedef ItemGroup
 * @property {string} id
 * @property {string} name
 */

(function() {

    const uuid = require("uuid/v4");

    angular
        .module("firebotApp")
        .factory("itemGroupService", function(logger, profileManager) {
            let service = {};

            /**
             * @type {Object.<string, ItemGroup[]>}
             */
            let itemGroups = {};

            /**
             * @type {Record<string,string>}
             */
            const selectedItemGroups = {};

            function getItemGroupsDb() {
                return profileManager
                    .getJsonDbInProfile("item-groups");
            }

            function saveAllItemGroups() {
                try {
                    getItemGroupsDb().push("/", itemGroups);

                    logger.debug(`Saved item groups.`);
                } catch (err) {
                    logger.warn(`There was an error saving item groups.`, err);
                }
            }

            service.loadItemGroups = () => {
                logger.debug(`Attempting to load item groups...`);

                try {
                    const itemGroupsData = getItemGroupsDb().getData("/");

                    if (itemGroupsData) {
                        itemGroups = itemGroupsData;
                    }

                    logger.debug(`Loaded item groups.`);
                } catch (err) {
                    logger.warn(`There was an error reading item groups file.`, err);
                }
            };

            service.addNewGroup = (context, name) => {
                if (service.groupNameExists(context, name)) {
                    return null;
                }

                const newGroup = {
                    id: uuid(),
                    name
                };

                service.getItemGroups(context).push(newGroup);

                saveAllItemGroups();

                return newGroup;
            };

            service.removeGroup = (context, groupId) => {
                if (itemGroups[context] == null) return;

                itemGroups[context] = itemGroups[context].filter(g => g.id !== groupId);

                saveAllItemGroups();
            };

            service.groupNameExists = (context, name) => {
                return service.getItemGroups(context).some(g => g.name === name);
            };

            /**
             * @param {string} context
             * @returns {ItemGroup[]}
             */
            service.getItemGroups = (context) => {
                if (itemGroups[context] == null) {
                    itemGroups[context] = [];
                }
                return itemGroups[context];
            };

            /** @param {string} context */
            service.getSelectedItemGroup = (context) => selectedItemGroups[context];

            /**
             * @param {string} context
             * @param {string} groupId
             */
            service.setSelectedItemGroup = (context, groupId) => {
                selectedItemGroups[context] = groupId;
            };

            /**
             * @param {string} context
             * @param {string} groupId
             */
            service.itemGroupIsSelected = (context, groupId) => selectedItemGroups[context] === groupId;

            return service;
        });
}());