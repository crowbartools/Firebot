"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const currencyDatabase = require("../../database/currencyDatabase");

const model = {
    definition: {
        handle: "currencyRank",
        description: "Returns the rank of the given user based on how much of the given currency they have.",
        usage: "currencyRank[currencyName, username]",
        categories: [VariableCategory.USER, VariableCategory.NUMBERS],
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

        let rank = await currencyDatabase.getUserCurrencyRank(currency.id, username, true);

        return rank;
    }
};

module.exports = model;
