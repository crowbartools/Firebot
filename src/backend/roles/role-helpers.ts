import { FirebotRole } from "../../types/roles";
import firebotRolesManager from "./firebot-roles-manager";
import chatRolesManager from "./chat-roles-manager";
import teamRolesManager from "./team-roles-manager";
import customRolesManager from "./custom-roles-manager";
import twitchRolesManager from "../../shared/twitch-roles";
import { TypedEmitter } from "tiny-typed-emitter";

export interface FirebotViewerRoles {
    twitchRoles: FirebotRole[];
    firebotRoles: FirebotRole[];
    customRoles: FirebotRole[];
    teamRoles: FirebotRole[];
}

type Events = {
    "viewer-role-updated": (userId: string, roleId: string, action: "added" | "removed") => void;
};

class RoleHelpers extends TypedEmitter<Events> {
    constructor() {
        super();

        chatRolesManager.on("viewer-role-updated", (userId, roleId, action) => {
            this.emit("viewer-role-updated", userId, roleId, action);
        });

        customRolesManager.on("viewer-role-updated", (userId, roleId, action) => {
            this.emit("viewer-role-updated", userId, roleId, action);
        });
    }

    async getAllRolesForViewer(userId: string): Promise<FirebotRole[]> {
        const roles = await this.getAllRolesForViewerNameSpaced(userId);

        return [
            ...roles.twitchRoles,
            ...roles.firebotRoles,
            ...roles.customRoles,
            ...roles.teamRoles
        ];
    }

    async getAllRolesForViewerNameSpaced(userId: string): Promise<FirebotViewerRoles> {
        return {
            twitchRoles: (await chatRolesManager.getUsersChatRoles(userId)).map(twitchRolesManager.mapTwitchRole),
            firebotRoles: firebotRolesManager.getAllFirebotRolesForViewer(userId),
            customRoles: customRolesManager.getAllCustomRolesForViewer(userId),
            teamRoles: await teamRolesManager.getAllTeamRolesForViewer(userId)
        };
    }

    async viewerHasRole(userId: string, expectedRoleId: string): Promise<boolean> {
        const viewerRoles = await this.getAllRolesForViewer(userId);
        return viewerRoles.some(r => r.id === expectedRoleId);
    }

    async viewerHasRoleByName(userId: string, expectedRoleName: string): Promise<boolean> {
        const viewerRoles = await this.getAllRolesForViewer(userId);
        return viewerRoles.some(r => r.name === expectedRoleName);
    }

    /**
    * Check if user has the given roles by their ids
    */
    async viewerHasRoles(userId: string, expectedRoleIds: string[]): Promise<boolean> {
        const viewerRoles = await this.getAllRolesForViewer(userId);
        return expectedRoleIds.every(n => viewerRoles.some(r => r.id === n));
    }

    /**
    * Check if user has the given roles by their names
    */
    async viewerHasRolesByName(userId: string, expectedRoleNames: string[]): Promise<boolean> {
        const viewerRoles = await this.getAllRolesForViewer(userId);
        return expectedRoleNames.every(n => viewerRoles.some(r => r.name === n));
    }
}

const roleHelpers = new RoleHelpers();

export default roleHelpers;