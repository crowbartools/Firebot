'use strict';

const currencyAccess = require("../../../../backend/currency/currency-access").default;
const currencyManager = require("../../../../backend/currency/currency-manager");

exports.getCurrencies = function(req, res) {
    const currencyName = req.params.currencyName;
    if (currencyName) {
        res.json(currencyAccess.getCurrencyByName(currencyName));
    } else {
        res.json(currencyAccess.getCurrencies());
    }
};

exports.getTopCurrencyHolders = async (req, res) => {
    const currencyName = req.params.currencyName;
    const { count } = req.query;

    let users = [];
    if (count) {
        users = await currencyManager.getTopCurrencyHolders(currencyName, count, true);
    } else {
        users = await currencyManager.getTopCurrencyHolders(currencyName, 10, true);
    }

    res.json(users);
};