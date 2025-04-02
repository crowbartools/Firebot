import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import currencyAccess from "../../../currency/currency-access";
import currencyManager from "../../../currency/currency-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "currencyRank",
        description: "Returns the rank of the current user based on how much of the given currency they have.",
        usage: "currencyRank[currencyName]",
        examples: [
            {
                usage: "currencyRank[currencyName, username]",
                description: "Returns the rank for the specified user in the specified currency"
            }
        ],
        categories: [VariableCategory.USER, VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (trigger: Trigger, currencyName: string, username?: string) => {
        username ??= trigger.metadata.username;
        if (currencyName == null || username == null) {
            return 0;
        }

        const currency = currencyAccess.getCurrencyByName(currencyName);

        if (currency == null) {
            return 0;
        }

        return await currencyManager.getViewerCurrencyRank(currency.id, username, true);
    }
};

export default model;