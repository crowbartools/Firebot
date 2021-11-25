"use strict";

const currencyDb = require("../../../../backend/database/currencyDatabase");

exports.getUserCurrency = async function(req, res) {
    const { userId, currencyId } = req.params;

    const { username } = req.query;

    if (userId == null) {
        return res.status(400).send({
            status: "error",
            message: `No viewerIdOrName provided`
        });
    }

    const currencies = (await currencyDb.getUserCurrencies(userId, username === "true")) || {};

    if (currencyId) {
        return res.json(currencies[currencyId]);
    }

    res.json(currencies);
};

exports.setUserCurrency = async function(req, res) {
    const { userId, currencyId } = req.params;
    const { username } = req.query;
    const options = req.body;

    if (options == null) {
        return res.status(400).send({
            status: "error",
            message: `No currency options provided`
        });
    }

    if (username === "true") {
        await currencyDb.adjustCurrencyForUser(userId, currencyId, parseInt(options.amount), options.setAmount ? "set" : "adjust");
    } else {
        await currencyDb.adjustCurrencyForUserById(userId, currencyId, parseInt(options.amount), options.setAmount === true);
    }

    res.status(204).send();
};