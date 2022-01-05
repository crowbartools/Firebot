'use strict';

const currencyDatabase = require("../../../../backend/database/currencyDatabase");

exports.getCurrencies = function(req, res) {
    const currencyName = req.params.currencyName;
    if (currencyName) {
        res.json(currencyDatabase.getCurrencyByName(currencyName));
    } else {
        res.json(currencyDatabase.getCurrencies());
    }
};

exports.getTopCurrencyHolders = async (req, res) => {
    const currencyName = req.params.currencyName;
    const { count } = req.query;

    let users = [];
    if (count) {
        users = await currencyDatabase.getTopCurrencyHolders(currencyName, count, true);
    } else {
        users = await currencyDatabase.getTopCurrencyHolders(currencyName, 10, true);
    }

    res.json(users);
};