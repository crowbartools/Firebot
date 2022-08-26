import { Request, Response } from "express";
const customRolesManager = require("../../../../backend/roles/custom-roles-manager");
const userDb = require("../../../../backend/database/userDatabase");

exports.getCustomRoles = async function(req: Request, res: Response) {
    const customRoles = customRolesManager.getCustomRoles()
        .map((cr: any) => {
            return {
                id: cr.id,
                name: cr.name,
                viewers: cr.viewers ?? []
            };
        });

    return res.json(customRoles);
};

exports.getCustomRoleById = async function(req: Request, res: Response) {
    const customRoleId: string = req.params.customRoleId;

    if (!(customRoleId.length > 0)) {
        return res.status(400).send({
            status: "error",
            message: "No customRoleId provided"
        });
    }

    const customRole = customRolesManager.getItem(customRoleId);

    if (customRole == null) {
        return res.status(404).send({
            status: "error",
            message: `Custom role '${customRoleId}' not found`
        });
    }

    const formattedCustomRole = {
        id: customRole.id,
        name: customRole.name,
        viewers: customRole.viewers ?? []
    };

    return res.json(formattedCustomRole);
};

exports.addUserToCustomRole = async function(req: Request, res: Response) {
    const { userId, customRoleId } = req.params;
    const { username } = req.query;

    if (userId == null) {
        return res.status(400).send({
            status: "error",
            message: `No viewerIdOrName provided`
        });
    }

    if (customRoleId == null) {
        return res.status(400).send({
            status: "error",
            message: `No customRoleId provided`
        });
    }

    let metadata;
    if (username === "true") {
        metadata = await userDb.getUserByUsername(userId);
    } else {
        metadata = await userDb.getUserById(userId);
    }

    if (metadata === null) {
        return res.status(404).send({
            status: "error",
            message: `Specified viewer does not exist`
        });
    }

    const customRole = customRolesManager.getCustomRoles().find((cr: any) => cr.id.toLowerCase() === customRoleId.toLowerCase());

    if (customRole == null) {
        return res.status(404).send({
            status: "error",
            message: `Specified custom role does not exist`
        });
    }

    customRolesManager.addViewerToRole(customRole.id, metadata.username);

    return res.status(201).send();
};

exports.removeUserFromCustomRole = async function(req: Request, res: Response) {
    const { userId, customRoleId } = req.params;
    const { username } = req.query;

    if (userId == null) {
        return res.status(400).send({
            status: "error",
            message: `No viewerIdOrName provided`
        });
    }

    if (customRoleId == null) {
        return res.status(400).send({
            status: "error",
            message: `No customRoleId provided`
        });
    }

    let metadata;
    if (username === "true") {
        metadata = await userDb.getUserByUsername(userId);
    } else {
        metadata = await userDb.getUserById(userId);
    }

    if (metadata === null) {
        return res.status(404).send({
            status: "error",
            message: `Specified viewer does not exist`
        });
    }

    const customRole = customRolesManager.getCustomRoles().find((cr: any) => cr.id.toLowerCase() === customRoleId.toLowerCase());

    if (customRole == null) {
        return res.status(404).send({
            status: "error",
            message: `Specified custom role does not exist`
        });
    }

    customRolesManager.removeViewerFromRole(customRole.id, metadata.username);

    return res.status(204).send();
};