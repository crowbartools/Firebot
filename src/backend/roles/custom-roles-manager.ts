import { JsonDB } from "node-json-db";
import path from "path";

import logger from "../logwrapper";
import util from "../utility";
import accountAccess from "../common/account-access";
import profileManager from "../common/profile-manager";
import frontendCommunicator from "../common/frontend-communicator";
import twitchApi from "../twitch-api/api";
import twitchRoleManager from "../../shared/twitch-roles";
import { BasicViewer } from "../../types/viewers";
import { TypedEmitter } from "tiny-typed-emitter";

interface CustomRole {
    id: string;
    name: string;
    viewers: Array<{
        id: string;
        username: string;
        displayName: string;
    }>;
}

type Events = {
    "created-item": (item: object) => void;
    "updated-item": (item: object) => void;
    "deleted-item": (item: object) => void;
    "viewer-role-updated": (userId: string, roleId: string, action: "added" | "removed") => void;
};

interface LegacyCustomRole {
    id: string;
    name: string;
    viewers: string[];
}

const ROLES_FOLDER = "roles";

class CustomRolesManager extends TypedEmitter<Events> {
    private _customRoles: Record<string, CustomRole> = {};

    constructor() {
        super();

        frontendCommunicator.onAsync("get-custom-roles", async () => this._customRoles);

        frontendCommunicator.on("save-custom-role", (role: CustomRole) => {
            this.saveCustomRole(role);
            this.triggerUiRefresh();
        });

        frontendCommunicator.on("delete-custom-role", (roleId: string) => {
            this.deleteCustomRole(roleId);
            this.triggerUiRefresh();
        });

        frontendCommunicator.on("check-for-legacy-custom-roles", () => {
            return profileManager.profileDataPathExistsSync(path.join(ROLES_FOLDER, "customroles.json"));
        });
    }

    async migrateLegacyCustomRoles(): Promise<void> {
        // Check for legacy custom roles file
        if (profileManager.profileDataPathExistsSync(path.join(ROLES_FOLDER, "customroles.json"))) {
            logger.info("Legacy custom roles file detected. Starting migration.");

            try {
                const legacyCustomRolesDb = profileManager.getJsonDbInProfile(path.join(ROLES_FOLDER, "customroles"));
                const legacyCustomRoles: Record<string, LegacyCustomRole> = legacyCustomRolesDb.getData("/");

                if (Object.keys(legacyCustomRoles).length > 0) {
                    if (accountAccess.getAccounts().streamer?.loggedIn !== true) {
                        logger.warn("Unable to migrate legacy custom roles. Streamer account is not logged in. Please login and restart Firebot.");
                        return;
                    }

                    for (const legacyRole of Object.values(legacyCustomRoles)) {
                        await this.importLegacyCustomRole(legacyRole);
                    }
                }

                logger.info("Deleting legacy custom roles database");
                profileManager.deletePathInProfile(path.join(ROLES_FOLDER, "customroles.json"));

                logger.info("Legacy custom role migration complete");
            } catch (error) {
                logger.error("Unexpected error during legacy custom role migration", error);
            }
        }
    }

    async importLegacyCustomRole(legacyRole: LegacyCustomRole) {
        logger.info(`Migrating legacy custom role ${legacyRole.name}`);

        const newCustomRole: CustomRole = {
            id: legacyRole.id,
            name: legacyRole.name,
            viewers: []
        };

        const usernameRegex = new RegExp("^[a-z0-9_]+$", "i");
        const viewersToMigrate: string[] = [];
        const unicodeViewers: string[] = [];
        const failedMigration: string[] = [];

        for (const viewer of legacyRole.viewers) {
            if (!viewer?.length) {
                continue;
            }

            if (usernameRegex.test(viewer) === true) {
                viewersToMigrate.push(viewer.toLowerCase());
            } else {
                unicodeViewers.push(viewer);
            }
        }

        // Maybe channel search gives us the Unicode users
        for (const viewer of unicodeViewers) {
            const results = await twitchApi.streamerClient.search.searchChannels(viewer);
            const channel = results.data?.find(c => c.displayName.toLowerCase() === viewer.toLowerCase());

            if (channel && channel.displayName.toLowerCase() === viewer.toLowerCase()) {
                newCustomRole.viewers.push({
                    id: channel.id,
                    username: channel.name,
                    displayName: channel.displayName
                });
            } else {
                failedMigration.push(viewer);
            }
        }

        const users = await twitchApi.users.getUsersByNames(viewersToMigrate);
        for (const viewer of viewersToMigrate) {
            const user = users.find(u => u.name === viewer);
            if (user != null) {
                newCustomRole.viewers.push({
                    id: user.id,
                    username: user.name,
                    displayName: user.displayName
                });
            } else {
                failedMigration.push(viewer);
            }
        }

        if (failedMigration.length > 0) {
            logger.warn(`Could not migrate the following viewers in legacy custom role ${newCustomRole.name}: ${failedMigration.join(", ")}`);
        }

        this.saveCustomRole(newCustomRole);
        logger.info(`Finished migrating legacy custom role ${newCustomRole.name}`);
    }

    async importCustomRole(role: LegacyCustomRole | CustomRole) {
        if (role == null) {
            return;
        }

        if (role.viewers?.length && !(role as CustomRole).viewers[0].id) {
            await this.importLegacyCustomRole(role as LegacyCustomRole);
        } else {
            this.saveCustomRole(role as CustomRole);
        }
    }

    private getCustomRolesDb(): JsonDB {
        return profileManager.getJsonDbInProfile(path.join(ROLES_FOLDER, "custom-roles"));
    }

    async loadCustomRoles(): Promise<void> {
        await this.migrateLegacyCustomRoles();

        logger.debug("Attempting to load custom roles");

        const rolesDb = this.getCustomRolesDb();

        try {
            const customRolesData = rolesDb.getData("/");

            if (customRolesData != null) {
                this._customRoles = customRolesData;
            }

            logger.debug("Loaded custom roles");

            await this.refreshCustomRolesUserData();
        } catch (error) {
            logger.warn("There was an error reading custom roles data file", error);
        }
    }

    async refreshCustomRolesUserData(): Promise<void> {
        logger.debug("Refreshing custom role user data");

        for (const customRole of Object.values(this._customRoles ?? {})) {
            logger.debug(`Updating custom role ${customRole.name}`);

            const userIds = customRole.viewers.map(v => v.id);
            const users = await twitchApi.users.getUsersByIds(userIds);

            for (const user of users) {
                const viewerIndex = customRole.viewers.findIndex(v => v.id === user.id);
                customRole.viewers[viewerIndex] = {
                    id: user.id,
                    username: user.name,
                    displayName: user.displayName
                };
            }

            this.saveCustomRole(customRole);
            logger.debug(`Custom role ${customRole.name} updated`);
        }
    }

    saveCustomRole(role: CustomRole) {
        if (role == null) {
            return;
        }

        if (role.viewers?.length && !role.viewers[0].id) {
            logger.error(`Cannot save custom role ${role} as it is in an older format`);
            return;
        }

        const previousRole = this._customRoles[role.id];

        const viewersAdded = role.viewers.filter(v => !previousRole?.viewers.map(pv => pv.id).includes(v.id)) ?? [];
        const viewersRemoved = previousRole?.viewers.filter(pv => !role.viewers.map(v => v.id).includes(pv.id)) ?? [];

        for (const viewer of viewersAdded) {
            this.emit("viewer-role-updated", viewer.id, role.id, "added");
        }
        for (const viewer of viewersRemoved) {
            this.emit("viewer-role-updated", viewer.id, role.id, "removed");
        }

        const eventType = this._customRoles[role.id] == null ? "created-item" : "updated-item";

        this._customRoles[role.id] = role;

        try {
            const rolesDb = this.getCustomRolesDb();

            rolesDb.push(`/${role.id}`, role);

            this.emit(eventType, role);

            logger.debug(`Saved role ${role.id} to file.`);
        } catch (error) {
            logger.warn("There was an error saving a role.", error);
        }
    }

    addViewerToRole(roleId: string, viewer: BasicViewer) {
        if (!viewer?.id?.length) {
            return;
        }
        const role = this._customRoles[roleId];
        if (role != null) {
            if (role.viewers.map(v => v.id).includes(viewer.id)) {
                return;
            }

            role.viewers.push({
                id: viewer.id,
                username: viewer.username,
                displayName: viewer.displayName
            });

            this.saveCustomRole(role);

            this.triggerUiRefresh();
        }
    }

    getCustomRoles(): CustomRole[] {
        return Object.values(this._customRoles);
    }

    getRoleByName(name: string): CustomRole {
        const roles = this.getCustomRoles();
        const roleIndex = util.findIndexIgnoreCase(roles.map(r => r.name), name);
        return roleIndex < 0 ? null : roles[roleIndex];
    }

    getAllCustomRolesForViewer(userId: string) {
        const roles = this.getCustomRoles();
        return roles
            .filter(r => r.viewers.map(v => v.id).includes(userId))
            .map((r) => {
                return {
                    id: r.id,
                    name: r.name
                };
            });
    }

    userIsInRole(userId: string, userTwitchRoles: string[], roleIdsToCheck: string[]): boolean {
        const roles = [
            ...(userTwitchRoles || []).map(twitchRoleManager.mapTwitchRole),
            ...this.getAllCustomRolesForViewer(userId)
        ];
        return roles.some(r => r != null && roleIdsToCheck.includes(r.id));
    }

    removeViewerFromRole(roleId: string, userId: string) {
        if (!userId?.length) {
            return;
        }
        const role = this._customRoles[roleId];
        if (role != null) {
            const index = role.viewers.map(v => v.id).indexOf(userId);

            if (index === -1) {
                return;
            }

            role.viewers.splice(index, 1);

            this.saveCustomRole(role);

            this.triggerUiRefresh();
        }
    }

    removeAllViewersFromRole(roleId: string): void {
        const role = this._customRoles[roleId];
        if (role != null) {
            role.viewers = [];

            this.saveCustomRole(role);

            this.triggerUiRefresh();
        }
    }

    deleteCustomRole(roleId: string) {
        if (!roleId?.length) {
            return;
        }

        const role = this._customRoles[roleId];

        delete this._customRoles[roleId];

        try {
            const rolesDb = this.getCustomRolesDb();

            rolesDb.delete(`/${roleId}`);

            this.emit("deleted-item", role);

            logger.debug(`Deleted role: ${roleId}`);
        } catch (error) {
            logger.warn("There was an error deleting a role.", error);
        }
    }

    triggerUiRefresh(): void {
        frontendCommunicator.send("custom-roles-updated");
    }
}

const customRolesManager = new CustomRolesManager();

export = customRolesManager;