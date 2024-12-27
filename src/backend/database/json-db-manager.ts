"use strict";

import profileManager from "../common/profile-manager";
import logger from "../logwrapper";
import { v4 as uuid } from "uuid";
import { TypedEmitter, type ListenerSignature } from "tiny-typed-emitter";
import { type JsonDB } from "node-json-db";

interface Item {
    id?: string;
    name?: string;
    [key: string]: unknown;
}

type DefaultEvents<I extends Item = Item> = {
    "loaded-items": (items: I[]) => void;
    "created-item": (item: I) => void;
    "updated-item": (item: I) => void;
    "saved-all-items": (items: I[]) => void;
    "deleted-item": (item: I) => void;
    "deleted-all-items": () => void;
};

/**
 * @hideconstructor
*/
class JsonDbManager<T extends Item, E extends ListenerSignature<E> = DefaultEvents<T>>
    extends TypedEmitter<E & DefaultEvents<T>> {

    protected items: { [key: string]: T };

    protected db: JsonDB;

    /**
     *
     * @param type - The type of data in the json file
     * @param path - The path to the json file
     */
    constructor(protected type: string, protected path: string) {
        super();

        this.type = type;

        /** @protected */
        this.items = {};

        /** @protected */
        this.db = profileManager.getJsonDbInProfile(path);
    }

    loadItems(): void {
        logger.debug(`Attempting to load ${this.type}s...`);

        try {
            const data = this.db.getData("/");
            if (data) {
                this.items = data;
            }

            logger.debug(`Loaded ${this.type}s.`);

            //@ts-ignore - typescript is handling the types for .emit poorly
            this.emit("loaded-items", Object.values(this.items));
        } catch (err) {
            logger.error(`There was an error reading ${this.type} file.`, err);
        }
    }

    getItem(itemId: string): T | null {
        if (itemId == null) {
            return null;
        }

        return this.items[itemId] || null;
    }

    getItemByName(itemName: string): T | null {
        if (itemName == null) {
            return null;
        }

        return Object.values(this.items).find(i => i.name === itemName) || null;
    }


    getAllItems(): T[] {
        return Object.values(this.items) || [];
    }

    saveItem(item: T): T | null {
        if (item == null) {
            return;
        }

        let isCreating = false;
        if (item.id == null) {
            item.id = uuid();
            isCreating = true;
        }

        this.items[item.id] = item;

        try {
            this.db.push(`/${item.id}`, item);

            logger.debug(`Saved ${this.type} with id ${item.id} to file.`);

            //@ts-ignore - typescript is handling the types for .emit poorly
            this.emit(isCreating ? "created-item" : "updated-item", item);
            return item;
        } catch (err) {
            logger.error(`There was an error saving ${this.type}.`, err);
            return null;
        }
    }

    saveAllItems(allItems: T[]): void {
        const itemsObject = allItems.reduce((acc, current) => {
            acc[current.id] = current;
            return acc;
        }, {});

        this.items = itemsObject;

        try {
            this.db.push("/", itemsObject);

            logger.debug(`Saved all ${this.type} to file.`);

            //@ts-ignore - typescript is handling the types for .emit poorly
            this.emit("saved-all-items", allItems);
        } catch (err) {
            logger.error(`There was an error saving all ${this.type}s.`, err);
        }
    }

    deleteItem(itemId: string): boolean {
        if (itemId == null) {
            return false;
        }

        const item = this.items[itemId];

        if (item == null) {
            return false;
        }

        delete this.items[itemId];

        try {
            this.db.delete(`/${itemId}`);

            logger.debug(`Deleted ${this.type}: ${itemId}`);

            //@ts-ignore - typescript is handling the types for .emit poorly
            this.emit("deleted-item", item);
            return true;
        } catch (err) {
            logger.error(`There was an error deleting ${this.type}.`, err);
        }

        return false;
    }

    deleteAllItems(): void {
        this.items = {};

        try {
            this.db.resetData("/");

            logger.debug(`Deleted all ${this.type}s.`);

            //@ts-ignore - typescript is handling the types for .emit poorly
            this.emit("deleted-all-items");
        } catch (err) {
            logger.error(`There was an error deleting all ${this.type}s.`, err);
        }
    }
}

export = JsonDbManager;