// Migration: info - Needs implementation details

"use strict";

const { OutputDataType } = require("../../../shared/variable-constants");

const currencyDatabase = require("../../database/currencyDatabase");
const util = require("../../utility");

const model = {
    definition: {
        handle: "topCurrency",
        description: "Comma separated list of users with the most of the given currency. Defaults to top 10, you can provide a custom number as a second argument.",
        usage: "topCurrency[currencyName]",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, currencyName, count = 10) => {

        if (currencyName == null) {
            return "[Invalid currency name]";
        }

        // limit to max of 50
        if (count > 50) {
            count = 50;
        } else if (count < 1) {
            // min of 1
            count = 1;
        }

        const currencyData = currencyDatabase.getCurrencies();

        if (currencyData == null) {
            return "[No currencies created]";
        }

        const currencies = Object.values(currencyData);

        const currency = currencies.find(c => c.name.toLowerCase() === currencyName.toLowerCase());

        if (currency == null) {
            return "[Invalid currency name]";
        }

        const topCurrencyHolders = await currencyDatabase.getTopCurrencyHolders(currency.id, count);

        const topHoldersDisplay = topCurrencyHolders.map((u, i) => {
            return `#${i + 1}) ${u.displayName} - ${util.commafy(u.currency[currency.id])}`;
        }).join(", ");

        return topHoldersDisplay;
    }
};

module.exports = model;
