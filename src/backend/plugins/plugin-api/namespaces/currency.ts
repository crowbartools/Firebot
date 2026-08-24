import type { PluginCurrencyApi } from "../../../../types/plugin-api";
import currencyAccess from "../../../currency/currency-access";
import currencyManager from "../../../currency/currency-manager";

import { definePluginApiNamespace } from "../internal/define-namespace";

export const createCurrencyApi = definePluginApiNamespace<PluginCurrencyApi> (() => {
    return {
        getAllCurrencies() {
            return Object.values(currencyAccess.getCurrencies());
        },

        getCurrencyById(id) {
            return currencyAccess.getCurrencyById(id);
        },

        getCurrencyByName(name) {
            return currencyAccess.getCurrencyByName(name);
        },

        async getViewerCurrency(userId, currencyId) {
            return await currencyManager.getViewerCurrencyAmountByUserId(userId, currencyId);
        },

        async addOrSubtractViewerCurrency(userId, currencyId, amount) {
            return await currencyManager.adjustCurrencyForViewerById(userId, currencyId, amount);
        },

        async setViewerCurrency(userId, currencyId, amount) {
            return await currencyManager.adjustCurrencyForViewerById(userId, currencyId, amount, true);
        },

        async getCurrencyLeaderboard(currencyId, count) {
            return await currencyManager.getTopCurrencyHolders(currencyId, count, false);
        }
    };
});