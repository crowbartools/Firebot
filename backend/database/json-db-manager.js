"use strict";

const profileManager = require("../common/profile-manager");
const logger = require("../logwrapper");
const uuidv1 = require("uuid/v1");

/** @template T */
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
     * @returns {Promise.<boolean>}
     */
    async loadItems() {
        logger.debug(`Attempting to load ${this.type}s...`);

        try {
            const data = this.db.getData("/");

            if (data) {
                this.items = data;
            }

            logger.debug(`Loaded ${this.type}s.`);

            return true;
        } catch (err) {
            logger.warn(`There was an error reading ${this.type} file.`, err);
            return false;
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

        return this.items[itemId];
    }

    /**
     * @returns {T[]}
     */
    getAllItems() {
        if (this.items == null) {
            return [];
        }

        return Object.values(this.items);
    }

    /**
     * @param {T} item
     * @returns {Promise.<T | null>}
     */
    async saveItem(item) {
        if (item == null) {
            return;
        }

        if (item.id != null) {
            this.items[item.id] = item;
        } else {
            item.id = uuidv1();
            this.items[item.id] = item;
        }

        try {
            this.db.push("/" + item.id, item);

            logger.debug(`Saved ${this.type} with id ${item.id} to file.`);

            return item;
        } catch (err) {
            logger.warn(`There was an error saving ${this.type}.`, err);
            return null;
        }
    }

    /**
     * @param {T[]} allItems
     * @returns {Promise.<boolean>}
     */
    async saveAllItems(allItems) {
        const itemsObject = allItems.reduce((acc, current) => {
            acc[current.id] = current;
            return acc;
        }, {});

        this.items = itemsObject;

        try {
            this.db.push("/", this.items);

            logger.debug(`Saved all ${this.type} to file.`);

            return true;

        } catch (err) {
            logger.warn(`There was an error saving all ${this.type}s.`, err);
            return false;
        }
    }

    /**
     * @param {string} itemId
     * @returns {Promise.<boolean>}
     */
    async deleteItem(itemId) {
        if (itemId == null) {
            return false;
        }

        delete this.items[itemId];

        try {
            this.db.delete("/" + itemId);

            logger.debug(`Deleted ${this.type}: ${itemId}`);

            return true;

        } catch (err) {
            logger.warn(`There was an error deleting ${this.type}.`, err);
            return false;
        }
    }

    /**
     * @returns {Promise.<boolean>}
     */
    async deleteAllItems() {
        this.items = {};

        try {
            this.db.delete("/");

            logger.debug(`Deleted all ${this.type}s.`);

            return true;

        } catch (err) {
            logger.warn(`There was an error deleting all ${this.type}s.`, err);
            return false;
        }
    }
}

module.exports = JsonDbManager;