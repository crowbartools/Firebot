import EventEmitter from "events";
import { JsonDB } from "node-json-db";

import { FirebotViewer } from "../../types/viewers";
import logger from "../logwrapper";
import frontendCommunicator from "../common/frontend-communicator";
import { SettingsManager } from "../common/settings-manager";
import profileManager from "../common/profile-manager";

export type Currency = {
    id: string;
    name: string;
    active: boolean;
    limit: number;
    transfer: "Allow" | "Disallow";
    interval: number;
    payout: number;

    /** Offline payout */
    offline?: number | string;

    /** Maps user role IDs to the amount of bonus payout they receive. */
    bonus: Record<string, number>;
};

type CurrencyCache = {
    [currencyName: string]: Currency
};

class CurrencyAccess extends EventEmitter {
    private _currencyCache: CurrencyCache = {};

    constructor() {
        super();

        frontendCommunicator.on("currencies:get-currencies", () => {
            return this.getCurrencies();
        });

        frontendCommunicator.on("currencies:get-currency-by-id", (currencyId: string) => {
            return this.getCurrencyById(currencyId);
        });

        frontendCommunicator.on("currencies:get-currency-by-name", (currencyName: string) => {
            return this.getCurrencyByName(currencyName);
        });

        frontendCommunicator.on("currencies:create-currency", (currency: Currency) => {
            this.createCurrency(currency);
        });

        frontendCommunicator.on("currencies:update-currency", (currency: Currency) => {
            this.updateCurrency(currency);
        });

        frontendCommunicator.on("currencies:delete-currency", (currency: Currency) => {
            this.deleteCurrency(currency);
        });
    }

    isViewerDBOn(): boolean {
        return SettingsManager.getSetting("ViewerDB");
    }

    getCurrencyDb(): JsonDB {
        return profileManager.getJsonDbInProfile("/currency/currency");
    }

    loadCurrencies(): void {
        if (this.isViewerDBOn() !== true) {
            return;
        }

        logger.debug("Refreshing currency cache");
        const db = this.getCurrencyDb();

        let resaveCurrencies = false;
        const cache: CurrencyCache = db.getData("/");

        Object.keys(cache).forEach((currencyId) => {
            if (cache[currencyId].offline === null || cache[currencyId].offline === "") {
                resaveCurrencies = true;
                cache[currencyId].offline = undefined;
            }
        });

        if (resaveCurrencies) {
            db.push("/", cache);
        }

        this._currencyCache = cache;
        frontendCommunicator.send("currencies:currencies-updated", this.getCurrencies());
    }

    getCurrencies(): CurrencyCache {
        return JSON.parse(JSON.stringify(this._currencyCache));
    }

    getCurrencyById(id: string): Currency {
        const currencies = Object.values(this._currencyCache);
        return currencies.find(c => c.id === id);
    }

    getCurrencyByName(name: string): Currency {
        if (!name.length) {
            return;
        }

        const currencies = Object.values(this._currencyCache);
        return currencies.find(c => c.name.toLowerCase() === name.toLowerCase());
    }

    addCurrencyToNewViewer(viewer: FirebotViewer): FirebotViewer {
        if (this.isViewerDBOn() !== true) {
            return;
        }
        const currencies = this.getCurrencies();

        Object.keys(currencies).forEach((c) => {
            const currency = currencies[c];
            viewer.currency[currency.id] = 0;
        });

        return viewer;
    }

    importCurrency(currency: Currency) {
        if (this.isViewerDBOn() !== true) {
            return;
        }

        if (currency == null || currency.id == null) {
            return;
        }

        if (!currency.offline) {
            currency.offline = undefined;
        }

        if (this.getCurrencyById(currency.id)) {
            this.updateCurrency(currency);
        } else {
            let hasDuplicate = false;
            let counter = 1;
            let name = currency.name;
            do {
                hasDuplicate = Object.values(this.getCurrencies())
                    .some(c => c.name === name);
                if (hasDuplicate) {
                    name = currency.name + counter;
                    counter++;
                }
            } while (hasDuplicate);
            currency.name = name;

            this.createCurrency(currency);
        }
    }

    createCurrency(currency: Currency) {
        if (this.isViewerDBOn() !== true) {
            return false;
        }

        if (Object.values(this._currencyCache).some(c => c.name === currency.name)) {
            logger.error(`User tried to create currency with the same name as another currency: ${currency.name}.`);
            return false;
        }

        this._currencyCache[currency.id] = currency;
        this.saveAllCurrencies();
        this.emit("currencies:currency-created", currency);

        logger.debug(`Currency created with name: ${currency.name}`);
        return true;
    }

    updateCurrency(currency: Currency) {
        if (this.isViewerDBOn() !== true) {
            return;
        }

        this._currencyCache[currency.id] = currency;
        this.saveAllCurrencies();
        this.emit("currencies:currency-updated", currency);
    }

    deleteCurrency(currency: Currency) {
        if (this.isViewerDBOn() !== true) {
            return;
        }

        delete this._currencyCache[currency.id];
        this.saveAllCurrencies();
        this.emit("currencies:currency-deleted", currency);
    }

    private saveAllCurrencies() {
        this.getCurrencyDb().push("/", this._currencyCache);
        frontendCommunicator.send("currencies:currencies-updated", this.getCurrencies());
    }
}

const currencyAccess = new CurrencyAccess();

export default currencyAccess;