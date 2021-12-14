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
        this.type = type;
        this._items = {};
        this.db = profileManager.getJsonDbInProfile(path);
    }

    /**
     * @returns {Promise.<void>}
     */
    async loadItems() {
        logger.debug(`Attempting to load ${this.type}s...`);

        try {
            const data = this.db.getData("/");

            if (data) {
                this._items = data;
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
        return this._items[itemId];
    }

    /**
     * @returns {T[]}
     */
    getAllItems() {
        if (this._items == null) {
            return null;
        }

        return this._items;
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
            this._items[item.id] = item;
        } else {
            item.id = uuidv1();
            this._items[item.id] = item;
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
     * @returns {Promise.<void>}
     */
    async saveAllItems(allItems) {
        const itemsObject = allItems.reduce((acc, current) => {
            acc[current.id] = current;
            return acc;
        }, {});

        this._items = itemsObject;

        try {
            this.db.push("/", this._items);

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

        delete this._items[itemId];

        try {
            this.db.delete("/" + itemId);

            logger.debug(`Deleted ${this.type}: ${itemId}`);

        } catch (err) {
            logger.warn(`There was an error deleting ${this.type}.`, err);
        }
    }
}

module.exports = JsonDbManager;