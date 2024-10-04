import customRolesManager from "../../../../backend/roles/custom-roles-manager";
import viewerDatabase from "../../../../backend/viewers/viewer-database";
import { Request, Response } from "express";
import { FirebotViewer } from "../../../../types/viewers";

export async function getCustomRoles(req: Request, res: Response): Promise<Response> {
    const customRoles = customRolesManager.getCustomRoles()
        .map((cr) => {
            return {
                id: cr.id,
                name: cr.name,
                viewers: cr.viewers ?? []
            };
        });

    return res.json(customRoles);
}

export async function getCustomRoleById(req: Request, res: Response): Promise<Response> {
    const customRoleId: string = req.params.customRoleId;

    if (!(customRoleId.length > 0)) {
        return res.status(400).send({
            status: "error",
            message: "No customRoleId provided"
        });
    }

    const customRole = customRolesManager.getCustomRoles().find(role => role.id.toLowerCase() === customRoleId.toLowerCase());

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
}

export async function addUserToCustomRole(req: Request, res: Response): Promise<Response> {
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

    let metadata: FirebotViewer;
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

    const customRole = customRolesManager.getCustomRoles().find(cr => cr.id.toLowerCase() === customRoleId.toLowerCase());

    if (customRole == null) {
        return res.status(404).send({
            status: "error",
            message: `Specified custom role does not exist`
        });
    }

    customRolesManager.addViewerToRole(customRole.id, {
        id: metadata._id,
        username: metadata.username,
        displayName: metadata.displayName
    });

    return res.status(201).send();
}

export async function removeUserFromCustomRole(req: Request, res: Response): Promise<Response> {
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

    let metadata: FirebotViewer;
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

    const customRole = customRolesManager.getCustomRoles().find(cr => cr.id.toLowerCase() === customRoleId.toLowerCase());

    if (customRole == null) {
        return res.status(404).send({
            status: "error",
            message: `Specified custom role does not exist`
        });
    }

    customRolesManager.removeViewerFromRole(customRole.id, metadata._id);

    return res.status(204).send();
}

export async function removeAllViewersFromRole(req: Request, res: Response): Promise<Response> {
    const { customRoleId } = req.params;


    if (customRoleId == null) {
        return res.status(400).send({
            status: "error",
            message: `No customRoleId provided`
        });
    }

    const customRole = customRolesManager.getCustomRoles().find(cr => cr.id.toLowerCase() === customRoleId.toLowerCase());

    if (customRole == null) {
        return res.status(404).send({
            status: "error",
            message: `Specified custom role does not exist`
        });
    }

    customRolesManager.removeAllViewersFromRole(customRole.id);

    return res.status(204).send();
}