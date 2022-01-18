"use strict";

const profileManager = require("../common/profile-manager");
const logger = require("../logwrapper");
const uuidv1 = require("uuid/v1");

/**
 * @template T
 * @hideconstructor
*/
class JsonDbManager {
    /**
     * @param {string} type - The type of data in the json file
     * @param {string} path - The path to the json file
     */
    constructor(type, path) {
        /** @protected */
        this.type = type;

        /** @protected */
        this.db = profileManager.getJsonDbInProfile(path);
    }

    /**
     * @returns {void}
     */
    loadItems() {
        logger.debug(`Attempting to load ${this.type}s...`);

        try {
            this.db.load();

            logger.debug(`Loaded ${this.type}s.`);
        } catch (err) {
            logger.error(`There was an error reading ${this.type} file.`, err);
        }
    }

    /**
     * @param {string} itemId
     * @returns {T | null}
     */
    getItem(itemId) {
        if (itemId == null) {
            return null;
        }

        try {
            const item = this.db.find("/", entry => entry.id === itemId);

            if (item) {
                return item;
            }

            logger.warn(`Couldn't find item of type ${this.type}`);
            return null;
        } catch (err) {
            logger.error(`There was an error reading the ${this.type} file.`, err);
            return null;
        }
    }

    /**
     * @param {string} itemName
     * @returns {T | null}
     */
    getItemByName(itemName) {
        if (itemName == null) {
            return null;
        }

        try {
            const item = this.db.find("/", entry => entry.name === itemName);

            if (item) {
                return item;
            }

            logger.warn(`Couldn't find item of type ${this.type}`);
            return null;
        } catch (err) {
            logger.error(`There was an error reading the ${this.type} file.`, err);
            return null;
        }
    }

    /**
     * @returns {T[]}
     */
    getAllItems() {
        try {
            const items = this.db.getData("/");

            if (items) {
                return Object.values(items);
            }

            logger.warn(`Couldn't get items of type ${this.type}`);
            return [];
        } catch (err) {
            logger.error(`There was an error reading the ${this.type} file.`, err);
            return [];
        }
    }

    /**
     * @param {T} item
     * @returns {T | null}
     */
    saveItem(item) {
        if (item == null) {
            return;
        }

        if (item.id == null) {
            item.id = uuidv1();
        }

        try {
            this.db.push("/" + item.id, item);

            logger.debug(`Saved ${this.type} with id ${item.id} to file.`);
            return item;
        } catch (err) {
            logger.error(`There was an error saving ${this.type}.`, err);
            return null;
        }
    }

    /**
     * @param {T[]} allItems
     * @returns {void}
     */
    saveAllItems(allItems) {
        const itemsObject = allItems.reduce((acc, current) => {
            acc[current.id] = current;
            return acc;
        }, {});

        try {
            this.db.push("/", itemsObject);

            logger.debug(`Saved all ${this.type} to file.`);
        } catch (err) {
            logger.error(`There was an error saving all ${this.type}s.`, err);
        }
    }

    /**
     * @param {string} itemId
     * @returns {void}
     */
    deleteItem(itemId) {
        if (itemId == null) {
            return false;
        }

        try {
            this.db.delete("/" + itemId);

            logger.debug(`Deleted ${this.type}: ${itemId}`);
        } catch (err) {
            logger.error(`There was an error deleting ${this.type}.`, err);
        }
    }

    /**
     * @returns {void}
     */
    deleteAllItems() {
        try {
            this.db.resetData("/");

            logger.debug(`Deleted all ${this.type}s.`);
        } catch (err) {
            logger.error(`There was an error deleting all ${this.type}s.`, err);
        }
    }
}

module.exports = JsonDbManager;