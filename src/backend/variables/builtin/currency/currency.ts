import type { ReplaceVariable, Trigger } from "../../../../types/variables";

import currencyAccess from "../../../currency/currency-access";
import currencyManager from "../../../currency/currency-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "currency",
        description: "How much of the given currency the current user has.",
        usage: "currency[currencyName, user]",
        hasSuggestions: true,
        noSuggestionsText: "No currencies have been created yet.",
        categories: ["user based", "numbers"],
        possibleDataOutput: ["number"]
    },
    getSuggestions: async () => {
        const currencies = Object.values(currencyAccess.getCurrencies());
        return currencies.flatMap(c => ([
            {
                usage: `currency[${c.name}, $user]`,
                description: `Get the ${c.name} amount for the current user`
            },
            {
                usage: `currency[${c.name}, someUserName]`,
                description: `Get the ${c.name} amount for a specific user`
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

        return await currencyManager.getViewerCurrencyAmount(username, currency.id);
    }
};

export default model;
