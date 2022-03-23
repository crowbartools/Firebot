"use strict";

const userDb = require("../../../../backend/database/userDatabase");
const customRolesManager = require("../../../../backend/roles/custom-roles-manager")
const currencyDb = require("../../../../backend/database/currencyDatabase");

exports.getAllUsers = async function(req, res) {
    return res.json(await userDb.getAllUsernamesWithIds());
}

exports.getUserMetadata = async function(req, res) {
    const { userId } = req.params;
    const { username } = req.query;

    if (userId == null) {
        return res.status(400).send({
            status: "error",
            message: `No viewerIdOrName provided`
        });
    }

    const metadata = username === "true" ?
        (await userDb.getUserByUsername(userId)) :
        (await userDb.getUserById(userId));

    if (metadata === null) {
        return res.status(404).send({
            status: "error",
            message: `Specified viewer does not exist`
        });
    }

    const customRoles = customRolesManager.getAllCustomRolesForViewer(metadata.username) ?? [];
    metadata.customRoles = customRoles;

    return res.json(metadata);
}

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