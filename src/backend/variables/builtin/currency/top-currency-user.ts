import type { ReplaceVariable } from "../../../../types/variables";

import currencyAccess from "../../../currency/currency-access";
import currencyManager from "../../../currency/currency-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "topCurrencyUser",
        description: "Get the username or amount for a specific position in the top currency",
        usage: "topCurrencyUser[currencyName, position, username/amount]",
        categories: ["user based", "advanced"],
        possibleDataOutput: ["text", "number"]
    },
    getSuggestions: async () => {
        const currencies = Object.values(currencyAccess.getCurrencies());
        return currencies.flatMap(c => ([
            {
                usage: `topCurrencyUser[${c.name}, 1, username]`,
                description: `Get the top ${c.name} username`
            },
            {
                usage: `topCurrencyUser[${c.name}, 5, amount]`,
                description: `Get the top ${c.name} amount at 5th position`
            }
        ]));
    },

    evaluator: async (_, currencyName: string, position: number = 1, usernameOrPosition = "username") => {

        if (currencyName == null) {
            return "[Invalid currency name]";
        }

        const currencyData = currencyAccess.getCurrencies();

        if (currencyData == null) {
            return "[No currencies created]";
        }

        const currencies = Object.values(currencyData);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currency = <{name: string, id: any} | null>currencies.find((c: {name: string, id: unknown}) => c.name.toLowerCase() === currencyName.toLowerCase());

        if (currency == null) {
            return "[Invalid currency name]";
        }

        const userAtPosition = await currencyManager.getTopCurrencyPosition(currency.id, position || 1);

        if (userAtPosition == null) {
            return "[Can't find user at position]";
        }

        if (usernameOrPosition === "username") {
            return userAtPosition.displayName;
        }
        return userAtPosition.currency[currency.id];
    }
};

export default model;