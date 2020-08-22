// Migration: info needed

"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const currencyDatabase = require("../../database/currencyDatabase");

const model = {
    definition: {
        handle: "currency",
        description: "How much of the given currency the given user has.",
        usage: "currency[currencyName, username]",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (_, currencyName, username) => {

        if (currencyName == null || username == null) {
            return 0;
        }

        let currencyData = currencyDatabase.getCurrencies();

        if (currencyData == null) {
            return 0;
        }

        let currencies = Object.values(currencyData);

        let currency = currencies.find(c => c.name.toLowerCase() === currencyName.toLowerCase());

        if (currency == null) {
            return 0;
        }

        let amount = await currencyDatabase.getUserCurrencyAmount(username, currency.id);

        return amount;
    }
};

module.exports = model;
