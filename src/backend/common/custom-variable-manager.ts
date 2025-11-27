
import { TypedEmitter } from "tiny-typed-emitter";
import NodeCache, { WrappedValue } from "node-cache";
import type { JsonDB } from "node-json-db";

import { EventManager } from "../events/event-manager";
import { ProfileManager } from "../common/profile-manager";
import { SettingsManager } from "./settings-manager";
import frontendCommunicator from './frontend-communicator';
import logger from '../logwrapper';
import { simpleClone } from '../utils';

interface CustomVariableInspectorItem {
    key: string;
    value: unknown;
    ttl: number;
}

type FirebotCacheData = {
    [key: string]: WrappedValue<unknown> & { meta?: {
        persist?: boolean;
    }; };
};

class CustomVariableManager extends TypedEmitter<{
    "created-item": (item: { name: string, value: unknown }) => void;
    "updated-item": (item: { name: string, value: unknown }) => void;
    "deleted-item": (item: { name: string, value: unknown }) => void;
}> {
    private _cache: NodeCache;

    constructor() {
        super();

        this._cache = new NodeCache({ stdTTL: 0, checkperiod: 1 });

        this._cache.on("set",
            (key: string, value: unknown) => this.onCustomVariableCreate(key, value)
        );

        this._cache.on("expired",
            (key: string, value: unknown) => this.onCustomVariableExpire(key, value)
        );

        this._cache.on("del",
            (key: string, value: unknown) => this.onCustomVariableDelete(key, value)
        );

        frontendCommunicator.on("custom-variables:get-initial-inspector-variables",
            () => this.getInitialInspectorVariables()
        );

        frontendCommunicator.on("custom-variables:delete",
            (key: string) => this.deleteCustomVariable(key)
        );
    }

    private onCustomVariableCreate(key: string, value: unknown): void {
        void EventManager.triggerEvent("firebot", "custom-variable-set", {
            username: "Firebot",
            createdCustomVariableName: key,
            createdCustomVariableData: value
        });

        frontendCommunicator.sendToVariableInspector("custom-variables:created", {
            key,
            value,
            ttl: this._cache.getTtl(key)
        });
    }

    private onCustomVariableExpire(key: string, value: unknown): void {
        void EventManager.triggerEvent("firebot", "custom-variable-expired", {
            username: "Firebot",
            expiredCustomVariableName: key,
            expiredCustomVariableData: value
        });

        frontendCommunicator.sendToVariableInspector("custom-variables:expired", {
            key,
            value
        });
    }

    private onCustomVariableDelete(key: string, value: unknown): void {
        this.emit("deleted-item", {
            name: key,
            value: value
        });

        frontendCommunicator.sendToVariableInspector("custom-variables:deleted", key);
    };

    private getVariableCacheDb(): JsonDB {
        return ProfileManager.getJsonDbInProfile("custom-variable-cache");
    }

    getInitialInspectorVariables(): CustomVariableInspectorItem[] {
        return Object.entries(this._cache.data)
            .map(([key, value]) => ({
                key,
                value: value.v as unknown,
                ttl: value.t
            }));
    }

    getAllVariables(): FirebotCacheData {
        return simpleClone(this._cache.data);
    }

    persistVariablesToFile(): void {
        const db = this.getVariableCacheDb();
        const persistAllVars = SettingsManager.getSetting("PersistCustomVariables");
        if (persistAllVars) {
            db.push("/", this._cache.data);
        } else {
            const dataToPersist = Object.entries(this._cache.data as FirebotCacheData).reduce((acc, [key, { t, v, meta }]) => {
                if (meta?.persist) {
                    acc[key] = { t, v, meta };
                }
                return acc;
            }, {} as FirebotCacheData);
            db.push("/", dataToPersist);
        }
    }

    loadVariablesFromFile(): void {
        const db = this.getVariableCacheDb();
        const data = db.getData("/") as FirebotCacheData;
        if (data) {
            const persistAllVars = SettingsManager.getSetting("PersistCustomVariables");
            for (const [key, { t, v, meta }] of Object.entries(data)) {
                if (!persistAllVars && !(meta?.persist)) {
                    // global persist disabled and this var wasn't marked to persist
                    continue;
                }
                const now = Date.now();
                if (t && t > 0 && t < now) {
                    // this var has expired
                    this.onCustomVariableExpire(key, v);
                    continue;
                }
                const ttl = t === 0 ? 0 : (t - now) / 1000;
                this.setValueWithMeta(key, v, ttl, meta);
            }
        }
    }

    private setValueWithMeta(key: string, value: unknown, ttl?: number, meta = {}): void {
        this._cache.set(key, value, ttl ?? 0);
        this._cache.data[key]["meta"] = meta;
    }

    addCustomVariable(
        name: string,
        data: unknown,
        ttl = 0,
        propertyPath: string = null,
        persist?: boolean
    ): void {
        //attempt to parse data as json
        try {
            data = JSON.parse(data as string);
        } catch { }

        const eventType = !this._cache.keys().includes(name)
            ? "created-item"
            : "updated-item";

        const dataRaw = data != null
            ? data.toString().toLowerCase()
            : "null";

        const dataIsNull = dataRaw === "null" || dataRaw === "undefined";

        const currentData = this._cache.get(name);

        const meta = (this._cache.data[name] as unknown as FirebotCacheData)?.meta ?? {};
        if (persist != null) {
            meta["persist"] = true;
        }

        if (propertyPath == null || propertyPath.length < 1) {
            let dataToSet = dataIsNull ? undefined : data;
            if (currentData && Array.isArray(currentData) && !Array.isArray(data) && !dataIsNull) {
                currentData.push(data);
                dataToSet = currentData;
            }
            this.setValueWithMeta(name, dataToSet, ttl, meta);
            this.emit(eventType, {
                name: name,
                value: dataToSet
            });
        } else {
            const currentData = this._cache.get(name);
            if (!currentData) {
                return;
            }
            try {
                let cursor = currentData;
                const pathNodes = propertyPath.split(".");
                for (let i = 0; i < pathNodes.length; i++) {
                    let node: string | number = pathNodes[i];

                    // parse to int for array access
                    if (!isNaN(Number(node))) {
                        node = parseInt(node);
                    }

                    const isLastItem = i === pathNodes.length - 1;
                    if (isLastItem) {

                        // if data recognized as null and cursor is an array, remove index instead of setting value
                        if (dataIsNull && Array.isArray(cursor) && typeof node === "number" && !isNaN(node)) {
                            cursor.splice(node, 1);
                        } else {
                        //if next node is an array and we detect we are not setting a new array or removing array, then push data to array
                            if (Array.isArray(cursor[node]) && !Array.isArray(data) && !dataIsNull) {
                                cursor[node].push(data);
                            } else {
                                cursor[node] = dataIsNull ? undefined : data;
                            }
                        }
                    } else {
                        cursor = cursor[node];
                    }
                }
                this.setValueWithMeta(name, currentData, ttl ?? 0, meta);
                this.emit(eventType, {
                    name: name,
                    value: currentData
                });
            } catch (error) {
                logger.debug(`Error setting data to custom variable ${name} using property path ${propertyPath}`, error);
            }
        }
    }

    getCustomVariable<T = unknown>(
        name: string,
        propertyPath?: string,
        defaultData?: T
    ): T {
        let data: T = this._cache.get(name);

        if (data == null) {
            return defaultData;
        }

        if (propertyPath == null || propertyPath === "null" || propertyPath === '') {
            return data;
        }

        try {
            const pathNodes = `${propertyPath}`.split(".");
            for (let i = 0; i < pathNodes.length; i++) {
                if (data == null) {
                    break;
                }
                let node: string | number = pathNodes[i];

                // parse to int for array access
                if (!isNaN(Number(node))) {
                    node = parseInt(node);
                }

                data = data[node] as T;
            }
            return data != null ? data : defaultData;
        } catch (error) {
            logger.debug(`Error getting data from custom variable ${name} using property path ${propertyPath}`, error);
            return defaultData;
        }
    }

    deleteCustomVariable(name: string): void {
        const data = this._cache.get(name);

        if (data == null) {
            logger.debug(`Cannot delete custom variable ${name}: Variable does not exist.`);
        }

        try {
            this._cache.del(name);

            logger.debug(`Custom variable ${name} deleted`);
        } catch (error) {
            logger.debug(`Error deleting custom variable ${name}: ${error}`);
        }
    }
}

const manager = new CustomVariableManager();

export { manager as CustomVariableManager };