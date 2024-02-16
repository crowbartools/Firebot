import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import currencyAccess from "../../../currency/currency-access";
import currencyManager from "../../../currency/currency-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "topCurrencyUser",
        description: "Get the username or amount for a specific position in the top currency",
        examples: [
            {
                usage: "topCurrencyUser[Points, 1, username]",
                description: "Get the top Points username"
            },
            {
                usage: "topCurrencyUser[Points, 5, amount]",
                description: "Get the top Points amount at 5th position"
            }
        ],
        usage: "topCurrencyUser[currencyName, position, username/amount]",
        categories: [VariableCategory.USER, VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
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