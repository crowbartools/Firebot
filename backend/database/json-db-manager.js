"use strict";

const profileManager = require("../common/profile-manager");
const logger = require("../logwrapper");
const uuidv1 = require("uuid/v1");

/** @template T */
class JsonDbManager {
    /**
     * @param {string} type - The type of data in the json file
     * @param {string} path - The path to the json file
     * @param {object} [dataPath] - The path to a subset of the data
     */
    constructor(type, path, dataPath = "") {
        /** @protected */
        this.type = type;

        /** @protected */
        this.dataPath = dataPath;

        /** @protected */
        this.items = {};

        /** @protected */
        this.db = profileManager.getJsonDbInProfile(path);
    }

    /**
     * @returns {Promise.<void>}
     */
    async loadItems() {
        logger.debug(`Attempting to load ${this.type}s...`);

        try {
            const data = this.db.getData(`${this.dataPath || '/'}`);

            if (data) {
                this.items = data;
            }

            logger.debug(`Loaded ${this.type}s.`);
        } catch (err) {
            logger.warn(`There was an error reading ${this.type} file.`, err);
        }
    }

    /**
     * @param {string} itemId
     * @returns {T}
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
            return null;
        }

        return Object.values(this.items);
    }

    /**
     * @param {T} item
     * @returns {Promise.<T>}
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
            this.db.push(`${this.dataPath}/${item.id}`, item);

            logger.debug(`Saved ${this.type} with id ${item.id} to file.`);

            return item;
        } catch (err) {
            logger.warn(`There was an error saving ${this.type}.`, err);
            return null;
        }
    }

    /**
     * @param {T[]} allItems
     * @returns {Promise.<void>}
     */
    async saveAllItems(allItems) {
        const itemsObject = allItems.reduce((acc, current) => {
            acc[current.id] = current;
            return acc;
        }, {});

        this.items = itemsObject;

        try {
            this.db.push(this.dataPath, this.items);

            logger.debug(`Saved all ${this.type} to file.`);

        } catch (err) {
            logger.warn(`There was an error saving all ${this.type}s.`, err);
            return null;
        }
    }

    /**
     * @param {string} itemId
     * @returns {Promise.<void>}
     */
    async deleteItem(itemId) {
        if (itemId == null) {
            return;
        }

        delete this.items[itemId];

        try {
            this.db.delete(`${this.dataPath}/${itemId}`);

            logger.debug(`Deleted ${this.type}: ${itemId}`);

        } catch (err) {
            logger.warn(`There was an error deleting ${this.type}.`, err);
        }
    }
}

module.exports = JsonDbManager;