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
        this.items = {};

        /** @protected */
        this.db = profileManager.getJsonDbInProfile(path);
    }

    /**
     * @returns {void}
     */
    loadItems() {
        logger.debug(`Attempting to load ${this.type}s...`);

        try {
            const data = this.db.getData("/");
            if (data) {
                this.items = data;
            }

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

        return this.items[itemId] || null;
    }

    /**
     * @param {string} itemName
     * @returns {T | null}
     */
    getItemByName(itemName) {
        if (itemName == null) {
            return null;
        }

        return Object.values(this.items).find(i => i.name === itemName) || null;
    }

    /**
     * @returns {T[]}
     */
    getAllItems() {
        return Object.values(this.items) || [];
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

        this.items[item.id] = item;

        try {
            this.db.push(`/${item.id}`, item);

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

        this.items = itemsObject;

        try {
            this.db.push("/", itemsObject);

            logger.debug(`Saved all ${this.type} to file.`);
        } catch (err) {
            logger.error(`There was an error saving all ${this.type}s.`, err);
        }
    }

    /**
     * @param {string} itemId
     * @returns {boolean}
     */
    deleteItem(itemId) {
        if (itemId == null) {
            return false;
        }

        delete this.items[itemId];

        try {
            this.db.delete(`/${itemId}`);

            logger.debug(`Deleted ${this.type}: ${itemId}`);
            return true;
        } catch (err) {
            logger.error(`There was an error deleting ${this.type}.`, err);
        }

        return false;
    }

    /**
     * @returns {void}
     */
    deleteAllItems() {
        this.items = {};

        try {
            this.db.resetData("/");

            logger.debug(`Deleted all ${this.type}s.`);
        } catch (err) {
            logger.error(`There was an error deleting all ${this.type}s.`, err);
        }
    }
}

module.exports = JsonDbManager;