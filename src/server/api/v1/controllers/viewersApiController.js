"use strict";

const viewerDatabase = require("../../../../backend/viewers/viewer-database");
const viewerMetaDataManager = require("../../../../backend/viewers/viewer-metadata-manager");
const customRolesManager = require("../../../../backend/roles/custom-roles-manager");
const currencyAccess = require("../../../../backend/currency/currency-access").default;
const currencyManager = require("../../../../backend/currency/currency-manager");
const customRolesApiController = require("./customRolesApiController");

exports.getAllUsers = async function (req, res) {
    return res.json(await viewerDatabase.getAllUsernamesWithIds());
};

exports.getUserMetadata = async function (req, res) {
    const { userId } = req.params;
    const { username } = req.query;

    if (userId == null) {
        return res.status(400).send({
            status: "error",
            message: `No viewerIdOrName provided`
        });
    }

    let metadata;
    if (username === "true") {
        metadata = await viewerDatabase.getViewerByUsername(userId);
    } else {
        metadata = await viewerDatabase.getViewerById(userId);
    }

    if (metadata === null) {
        return res.status(404).send({
            status: "error",
            message: `Specified viewer does not exist`
        });
    }

    const customRoles = customRolesManager.getAllCustomRolesForViewer(metadata._id) ?? [];
    metadata.customRoles = customRoles;

    return res.json(metadata);
};

exports.updateUserMetadataKey = async function (req, res) {
    const { data: metadataValue } = req.body;
    const { metadataKey, userId } = req.params;
    const { username } = req.query;

    if (userId == null) {
        return res.status(400).send({
            status: "error",
            message: `No viewerIdOrName provided`
        });
    }

    if (metadataKey == null) {
        return res.status(400).send({
            status: "error",
            message: `No metadataKey provided`
        });
    }

    let viewer;
    if (username === "true") {
        viewer = await viewerDatabase.getViewerByUsername(userId);
    } else {
        viewer = await viewerDatabase.getViewerById(userId);
    }

    if (viewer === null) {
        return res.status(404).send({
            status: "error",
            message: `Specified viewer does not exist`
        });
    }

    await viewerMetaDataManager.updateViewerMetadata(viewer.username, metadataKey, metadataValue);
    const status = metadataKey in viewer.metadata ? 204 : 201;

    return res.status(status).send();
};

exports.removeUserMetadataKey = async function (req, res) {
    const { metadataKey, userId } = req.params;
    const { username } = req.query;

    if (userId == null) {
        return res.status(400).send({
            status: "error",
            message: `No viewerIdOrName provided`
        });
    }

    if (metadataKey == null) {
        return res.status(400).send({
            status: "error",
            message: `No metadataKey provided`
        });
    }

    let viewer;
    if (username === "true") {
        viewer = await viewerDatabase.getViewerByUsername(userId);
    } else {
        viewer = await viewerDatabase.getViewerById(userId);
    }

    if (viewer === null) {
        return res.status(404).send({
            status: "error",
            message: `Specified viewer does not exist`
        });
    }

    if (!(metadataKey in viewer.metadata)) {
        return res.status(404).send({
            status: "error",
            message: `Specified metadataKey does not exist`
        });
    }

    await viewerMetaDataManager.removeViewerMetadata(viewer.username, metadataKey);

    return res.status(204).send();
};

exports.getUserCurrency = async function (req, res) {
    const { userId, currencyId } = req.params;

    const { username } = req.query;

    if (userId == null) {
        return res.status(400).send({
            status: "error",
            message: `No viewerIdOrName provided`
        });
    }

    const currencies = (await currencyManager.getViewerCurrencies(userId, username === "true")) || {};

    if (currencyId) {
        return res.json(currencies[currencyId]);
    }

    res.json(currencies);
};

exports.setUserCurrency = async function (req, res) {
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
        await currencyManager.adjustCurrencyForViewer(
            userId,
            currencyId,
            parseInt(options.amount),
            options.setAmount ? "set" : "adjust"
        );
    } else {
        await currencyManager.adjustCurrencyForViewerById(
            userId,
            currencyId,
            parseInt(options.amount),
            options.setAmount === true
        );
    }

    res.status(204).send();
};

exports.getUserCustomRoles = async function (req, res) {
    const { userId } = req.params;
    const { username } = req.query;

    if (userId == null) {
        return res.status(400).send({
            status: "error",
            message: `No viewerIdOrName provided`
        });
    }

    let metadata;
    if (username === "true") {
        metadata = await viewerDatabase.getViewerByUsername(userId);
    } else {
        metadata = await viewerDatabase.getViewerById(userId);
    }

    if (metadata === null) {
        return res.status(404).send({
            status: "error",
            message: `Specified viewer does not exist`
        });
    }

    const customRoles = customRolesManager.getAllCustomRolesForViewer(metadata._id) ?? [];

    return res.json(customRoles);
};

exports.addUserToCustomRole = async function (req, res) {
    return customRolesApiController.addUserToCustomRole(req, res);
};

exports.removeUserFromCustomRole = async function (req, res) {
    return customRolesApiController.removeUserFromCustomRole(req, res);
};

exports.getAllUserDataAsJSON = async function (req, res) {
    const viewerDb = viewerDatabase.getViewerDb();

    const allCurrencyDetails = currencyAccess.getCurrencies();

    res.json(
        (await viewerDb.findAsync({})).map((user) => {
            const expandedUserCurrencies = {};
            Object.keys(user.currency).forEach((userCurrencyKey) => {
                if (Object.hasOwn(allCurrencyDetails, userCurrencyKey)) {
                    expandedUserCurrencies[userCurrencyKey] = {
                        id: userCurrencyKey,
                        name: allCurrencyDetails[userCurrencyKey].name,
                        amount: user.currency[userCurrencyKey]
                    };
                } else {
                    expandedUserCurrencies[userCurrencyKey] = {
                        id: userCurrencyKey,
                        name: "unknown",
                        amount: user.currency[userCurrencyKey]
                    };
                }
            });
            user.currency = expandedUserCurrencies;
            return user;
        })
    );
};
