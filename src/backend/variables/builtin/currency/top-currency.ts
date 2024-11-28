import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";

import currencyAccess from "../../../currency/currency-access";
import currencyManager from "../../../currency/currency-manager";
const util = require("../../../utility");

const model : ReplaceVariable = {
    definition: {
        handle: "topCurrency",
        description: "Comma separated list of users with the most of the given currency. Defaults to top 10, you can provide a custom number as a second argument.",
        usage: "topCurrency[currencyName]",
        examples: [
            {
                usage: "topCurrency[Points, 5]",
                description: "Returns comma-separated list of top 5 users with their Points amounts"
            }
        ],
        possibleDataOutput: [OutputDataType.TEXT]
    },

    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    evaluator: async (_, currencyName: string, count: number = 10) => {

        if (currencyName == null) {
            return "[Invalid currency name]";
        }

        // limit to max of 50
        if (count > 50) {
            count = 50;
        } else if (count < 1) {
            // min of 1
            count = 1;
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

        const topCurrencyHolders = await currencyManager.getTopCurrencyHolders(currency.id, count);

        const topHoldersDisplay = topCurrencyHolders.map((u, i) => {
            return `#${i + 1}) ${u.displayName} - ${util.commafy(u.currency[currency.id])}`;
        }).join(", ");

        return topHoldersDisplay;
    }
};

export default model;