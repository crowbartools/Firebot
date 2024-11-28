import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import currencyAccess from "../../../currency/currency-access";
import currencyManager from "../../../currency/currency-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "currency",
        description: "How much of the given currency the current user has.",
        usage: "currency[currencyName]",
        examples: [
            {
                usage: "currency[currencyName, username]",
                description: "Returns the amount of specified currency the given user fas"
            }
        ],
        categories: [VariableCategory.USER, VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (_, currencyName: string, username: string) => {
        if (currencyName == null || username == null) {
            return 0;
        }

        const currency = currencyAccess.getCurrencyByName(currencyName);

        if (currency == null) {
            return 0;
        }

        return await currencyManager.getViewerCurrencyAmount(username, currency.id);
    }
};

export default model;
