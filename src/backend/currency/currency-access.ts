import { FirebotViewer } from "../../types/viewers";

import logger from "../logwrapper";
import frontendCommunicator from "../common/frontend-communicator";
import { settings } from "../common/settings-access";
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
    offline: number;

    /** Maps user role IDs to the amount of bonus payout they receive. */
    bonus: Record<string, number>;
};

type CurrencyCache = {
    [currencyName: string]: Currency
};

class CurrencyAccess {
    private _currencyCache: CurrencyCache = {};

    constructor() {
        // Refresh Currency Cache
        // This gets a message from front end when a currency needs to be created.
        // This is also triggered in the currencyManager.
        frontendCommunicator.on("refresh-currency-cache", () => {
            this.refreshCurrencyCache();
        });
    }

    isViewerDBOn(): boolean {
        return settings.getViewerDbStatus();
    }

    refreshCurrencyCache(): void {
        if (this.isViewerDBOn() !== true) {
            return;
        }

        logger.debug("Refreshing currency cache");
        const db = profileManager.getJsonDbInProfile("/currency/currency");

        let issue2801 = false;
        const cache = db.getData("/");
        Object.keys(cache).forEach((currencyId) => {
            if (cache[currencyId].offline === null || cache[currencyId].offline === "") {
                issue2801 = true;
                cache[currencyId].offline = undefined;
            }
        });
        if (issue2801) {
            db.push("/", cache);
        }
        this._currencyCache = cache;
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
}

const currencyAccess = new CurrencyAccess();

export default currencyAccess;