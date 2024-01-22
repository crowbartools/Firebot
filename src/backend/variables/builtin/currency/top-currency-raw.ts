import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";

const currencyDatabase = require("../../../database/currencyDatabase");

const model : ReplaceVariable = {
    definition: {
        handle: "rawTopCurrency",
        description: "Returns a raw array containing those with the most of the specified currency. Items in the array contain 'place', 'username' and 'amount' properties",
        usage: "rawTopCurrency[currencyName]",
        possibleDataOutput: [OutputDataType.TEXT]
    },

    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    evaluator: async (_, currencyName: string, count: number = 10) => {

        if (currencyName == null) {
            return [];
        }

        // limit to max of 50
        if (count > 50) {
            count = 50;
        } else if (count < 1) {
            // min of 1
            count = 1;
        }

        const currencyData = currencyDatabase.getCurrencies();

        if (currencyData == null) {
            return [];
        }

        const currencies = Object.values(currencyData);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currency = <{name: string, id: any} | null>currencies.find((c: {name: string, id: unknown}) => c.name.toLowerCase() === currencyName.toLowerCase());

        if (currency == null) {
            return [];
        }

        const topCurrencyHolders = await currencyDatabase.getTopCurrencyHolders(currency.id, count);

        const topHoldersDisplay = topCurrencyHolders.map((u, i) => ({
            place: i + 1,
            username: u.displayName,
            amount: u.currency[currency.id]
        }));

        return topHoldersDisplay;
    }
};

export default model;
