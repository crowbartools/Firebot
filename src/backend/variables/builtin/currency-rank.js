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

        const currency = currencyDatabase.getCurrencyByName(currencyName);

        if (currency == null) {
            return 0;
        }

        return await currencyDatabase.getUserCurrencyRank(currency.id, username, true);
    }
};

module.exports = model;
