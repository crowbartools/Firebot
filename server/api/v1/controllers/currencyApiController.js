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