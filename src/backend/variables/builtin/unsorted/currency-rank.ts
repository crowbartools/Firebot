import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const currencyDatabase = require("../../../database/currencyDatabase");

const model : ReplaceVariable = {
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

export default model;