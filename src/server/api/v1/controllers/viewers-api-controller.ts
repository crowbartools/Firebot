import { Request, Response } from "express";
import { FirebotViewer } from "../../../../types/viewers";
import * as customRolesApiController from "./custom-roles-api-controller";
import viewerDatabase from "../../../../backend/viewers/viewer-database";
import viewerMetaDataManager from "../../../../backend/viewers/viewer-metadata-manager";
import customRolesManager from "../../../../backend/roles/custom-roles-manager";
import currencyAccess from "../../../../backend/currency/currency-access";
import currencyManager from "../../../../backend/currency/currency-manager";

export async function getAllUsers(req: Request, res: Response): Promise<void> {
    res.json(await viewerDatabase.getAllUsernamesWithIds());
};

export async function getUserMetadata(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { username } = req.query;

    if (userId == null) {
        res.status(400).send({
            status: "error",
            message: `No viewerIdOrName provided`
        });
    }

    let metadata: FirebotViewer;
    if (username === "true") {
        metadata = await viewerDatabase.getViewerByUsername(userId);
    } else {
        metadata = await viewerDatabase.getViewerById(userId);
    }

    if (metadata === null) {
        res.status(404).send({
            status: "error",
            message: `Specified viewer does not exist`
        });
    }

    const customRoles = customRolesManager.getAllCustomRolesForViewer(metadata._id) ?? [];

    res.json({
        ...metadata,
        customRoles
    });
};

export async function updateUserMetadataKey(
    req: Request<{
        metadataKey: string;
        userId: string;
    }, undefined, {
        data: string;
    }>,
    res: Response
): Promise<void> {
    const { data: metadataValue } = req.body;
    const { metadataKey, userId } = req.params;
    const { username } = req.query;

    if (userId == null) {
        res.status(400).send({
            status: "error",
            message: `No viewerIdOrName provided`
        });
    }

    if (metadataKey == null) {
        res.status(400).send({
            status: "error",
            message: `No metadataKey provided`
        });
    }

    let viewer: FirebotViewer;
    if (username === "true") {
        viewer = await viewerDatabase.getViewerByUsername(userId);
    } else {
        viewer = await viewerDatabase.getViewerById(userId);
    }

    if (viewer === null) {
        res.status(404).send({
            status: "error",
            message: `Specified viewer does not exist`
        });
    }

    await viewerMetaDataManager.updateViewerMetadata(viewer.username, metadataKey, metadataValue);
    const status = metadataKey in viewer.metadata ? 204 : 201;

    res.status(status).send();
};

export async function removeUserMetadataKey(req: Request, res: Response): Promise<void> {
    const { metadataKey, userId } = req.params;
    const { username } = req.query;

    if (userId == null) {
        res.status(400).send({
            status: "error",
            message: `No viewerIdOrName provided`
        });
    }

    if (metadataKey == null) {
        res.status(400).send({
            status: "error",
            message: `No metadataKey provided`
        });
    }

    let viewer: FirebotViewer;
    if (username === "true") {
        viewer = await viewerDatabase.getViewerByUsername(userId);
    } else {
        viewer = await viewerDatabase.getViewerById(userId);
    }

    if (viewer === null) {
        res.status(404).send({
            status: "error",
            message: `Specified viewer does not exist`
        });
    }

    if (!(metadataKey in viewer.metadata)) {
        res.status(404).send({
            status: "error",
            message: `Specified metadataKey does not exist`
        });
    }

    await viewerMetaDataManager.removeViewerMetadata(viewer.username, metadataKey);

    res.status(204).send();
};

export async function getUserCurrency(req: Request, res: Response): Promise<void> {
    const { userId, currencyId } = req.params;

    const { username } = req.query;

    if (userId == null) {
        res.status(400).send({
            status: "error",
            message: `No viewerIdOrName provided`
        });
    }

    const currencies = (await currencyManager.getViewerCurrencies(userId, username === "true")) || {};

    if (currencyId) {
        res.json(currencies[currencyId]);
    }

    res.json(currencies);
};

export async function setUserCurrency(req: Request, res: Response): Promise<void> {
    const { userId, currencyId } = req.params;
    const { username } = req.query;
    const options = req.body as {
        amount: string;
        setAmount: boolean;
    };

    if (options == null) {
        res.status(400).send({
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

export async function getUserCustomRoles(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { username } = req.query;

    if (userId == null) {
        res.status(400).send({
            status: "error",
            message: `No viewerIdOrName provided`
        });
    }

    let metadata: FirebotViewer;
    if (username === "true") {
        metadata = await viewerDatabase.getViewerByUsername(userId);
    } else {
        metadata = await viewerDatabase.getViewerById(userId);
    }

    if (metadata === null) {
        res.status(404).send({
            status: "error",
            message: `Specified viewer does not exist`
        });
    }

    const customRoles = customRolesManager.getAllCustomRolesForViewer(metadata._id) ?? [];

    res.json(customRoles);
};

export async function addUserToCustomRole(req: Request, res: Response): Promise<void> {
    return await customRolesApiController.addUserToCustomRole(req, res);
};

export async function removeUserFromCustomRole(req: Request, res: Response): Promise<void> {
    return await customRolesApiController.removeUserFromCustomRole(req, res);
};

export async function getAllUserDataAsJSON(req: Request, res: Response): Promise<void> {
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