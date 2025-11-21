import type { JsonDB } from "node-json-db";
import { TypedEmitter, type ListenerSignature } from "tiny-typed-emitter";
import { randomUUID } from "crypto";

import { AppCloseListenerManager } from "../app-management/app-close-listener-manager";
import { ProfileManager } from "../common/profile-manager";
import logger from "../logwrapper";

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
    "items-changed": (items: I[]) => void;
};

abstract class JsonDbManager<T extends Item, E extends ListenerSignature<E> = DefaultEvents<T>>
    extends TypedEmitter<E & DefaultEvents<T>> {

    protected items: { [key: string]: T };
    protected db: JsonDB;
    private batchedSaveTimeout: NodeJS.Timeout | null = null;

    /**
     * @param type - The type of data in the json file
     * @param path - The path to the json file
     */
    constructor(protected type: string, protected path: string) {
        super();

        this.type = type;
        this.items = {};
        this.db = ProfileManager.getJsonDbInProfile(path);

        AppCloseListenerManager.registerListener(() => {
            if (this.batchedSaveTimeout) {
                clearTimeout(this.batchedSaveTimeout);
                this.batchedSaveTimeout = null;
                logger.debug(`App is closing, saving any batched ${this.type} before exit...`);
                this.saveCurrentItems();
            }
        });
    }

    loadItems(): void {
        logger.debug(`Attempting to load ${this.type}s...`);

        try {
            const data = this.db.getData("/") as { [key: string]: T };
            if (data) {
                this.items = data;
            }

            logger.debug(`Loaded ${this.type}s.`);

            //@ts-ignore - typescript is handling the types for .emit poorly
            this.emit("loaded-items", Object.values(this.items));
            this.emitItemsChanged();
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

    saveItem(item: T, isCreating = false, batchSave = false): T | null {
        if (item == null) {
            return;
        }

        if (item.id == null) {
            item.id = randomUUID();
            isCreating = true;
        }

        this.items[item.id] = item;

        //@ts-ignore - typescript is handling the types for .emit poorly
        this.emit(isCreating ? "created-item" : "updated-item", item);
        this.emitItemsChanged();

        if (batchSave) {
            if (!this.batchedSaveTimeout) {
                this.batchedSaveTimeout = setTimeout(() => {
                    this.batchedSaveTimeout = null;
                    this.saveCurrentItems();
                }, 5000);
            }
            return item;
        }

        try {
            this.db.push(`/${item.id}`, item);
            logger.debug(`Saved ${this.type} with id ${item.id} to file.`);
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
            this.emitItemsChanged();
        } catch (err) {
            logger.error(`There was an error saving all ${this.type}s.`, err);
        }
    }

    private saveCurrentItems(): void {
        try {
            this.db.push("/", this.items);
            logger.debug(`Batched saved ${this.type} to file.`);
        } catch (err) {
            logger.error(`There was an error batch saving ${this.type}s.`, err);
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
            this.emitItemsChanged();
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
            this.emitItemsChanged();
        } catch (err) {
            logger.error(`There was an error deleting all ${this.type}s.`, err);
        }
    }

    private emitItemsChanged() {
        //@ts-ignore - typescript is handling the types for .emit poorly
        this.emit("items-changed", Object.values(this.items));
    }
}

export = JsonDbManager;