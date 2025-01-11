import currencyAccess from "../../../../backend/currency/currency-access";
import currencyManager from "../../../../backend/currency/currency-manager";
import { Request, Response } from "express";

export function getCurrencies(req: Request, res: Response) {
    const currencyName = req.params.currencyName;
    if (currencyName) {
        res.json(currencyAccess.getCurrencyByName(currencyName));
    } else {
        res.json(currencyAccess.getCurrencies());
    }
}

export async function getTopCurrencyHolders(req: Request, res: Response): Promise<Response> {
    const currencyName = req.params.currencyName;
    const { count } = req.query;

    let users = [];
    if (count) {
        users = await currencyManager.getTopCurrencyHolders(currencyName, Number(count), true);
    } else {
        users = await currencyManager.getTopCurrencyHolders(currencyName, 10, true);
    }

    return res.json(users);
}