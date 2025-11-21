import type { ReplaceVariable, Trigger } from "../../../../types/variables";

import currencyAccess from "../../../currency/currency-access";
import currencyManager from "../../../currency/currency-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "currencyRank",
        description: "Returns the rank of the current user based on how much of the given currency they have.",
        usage: "currencyRank[currencyName]",
        hasSuggestions: true,
        noSuggestionsText: "No currencies have been created yet.",
        categories: ["user based", "numbers"],
        possibleDataOutput: ["number"]
    },
    getSuggestions: async () => {
        const currencies = Object.values(currencyAccess.getCurrencies());
        return currencies.flatMap(c => ([
            {
                usage: `currencyRank[${c.name}, $user]`,
                description: `Get the ${c.name} rank for the current user`
            },
            {
                usage: `currencyRank[${c.name}, someUserName]`,
                description: `Get the ${c.name} rank for a specific user`
            }
        ]));
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