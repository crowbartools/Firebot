"use strict";

const logger = require("../logwrapper");
const profileManager = require("../common/profile-manager");
const frontendCommunicator = require("../common/frontend-communicator");
const twitchRoleManager = require("../../shared/twitch-roles");

/**
 * @typedef CustomRole
 * @property {string} id
 * @property {string} name
 * @property {string[]} viewers
 */

/** @type {Object.<string, CustomRole>} */
let customRoles = {};

const ROLES_FOLDER = "/roles/";
function getCustomRolesDb() {
    return profileManager.getJsonDbInProfile(`${ROLES_FOLDER}customroles`);
}

function loadCustomRoles() {
    logger.debug(`Attempting to load roles data...`);

    const rolesDb = getCustomRolesDb();

    try {
        const customRolesData = rolesDb.getData("/");

        if (customRolesData) {
            customRoles = customRolesData;
        }

        logger.debug(`Loaded roles data.`);
    } catch (err) {
        logger.warn(`There was an error reading roles data file.`, err);
    }
}

function saveCustomRole(role) {
    if (role == null) {
        return;
    }

    customRoles[role.id] = role;

    try {
        const rolesDb = getCustomRolesDb();

        rolesDb.push(`/${role.id}`, role);

        logger.debug(`Saved role ${role.id} to file.`);

    } catch (err) {
        logger.warn(`There was an error saving a role.`, err);
    }
}

function deleteCustomRole(roleId) {
    if (roleId == null) {
        return;
    }

    delete customRoles[roleId];

    try {
        const rolesDb = getCustomRolesDb();

        rolesDb.delete(`/${roleId}`);

        logger.debug(`Deleted role: ${roleId}`);

    } catch (err) {
        logger.warn(`There was an error deleting a role.`, err);
    }
}

const findIndexIgnoreCase = (array, element) => {
    if (Array.isArray(array)) {
        const search = array.findIndex(e => e.toString().toLowerCase() ===
            element.toString().toLowerCase());
        return search;
    }
    return -1;
};

function addViewerToRole(roleId, username) {
    if (username == null || username.length < 1) {
        return;
    }
    const role = customRoles[roleId];
    if (role) {
        if (findIndexIgnoreCase(role.viewers, username) !== -1) {
            return;
        }

        role.viewers.push(username);

        saveCustomRole(role);

        exports.triggerUiRefresh();
    }
}

function removeAllViewersFromRole(roleId) {
    const role = customRoles[roleId];
    if (role) {
        role.viewers = [];

        saveCustomRole(role);

        exports.triggerUiRefresh();
    }
}

function removeViewerFromRole(roleId, username) {
    if (username == null || username.length < 1) {
        return;
    }
    const role = customRoles[roleId];
    if (role) {
        const index = findIndexIgnoreCase(role.viewers, username);

        if (index === -1) {
            return;
        }

        role.viewers.splice(index, 1);

        saveCustomRole(role);

        exports.triggerUiRefresh();
    }
}

function getAllCustomRolesForViewer(username) {
    const roles = Object.values(customRoles);
    return roles
        .filter(r => findIndexIgnoreCase(r.viewers, username) !== -1)
        .map(r => {
            return {
                id: r.id,
                name: r.name
            };
        });
}

function userIsInRole(username, userTwitchRoles, roleIdsToCheck) {
    const roles = [
        ...(userTwitchRoles || []).map(twitchRoleManager.mapTwitchRole),
        ...getAllCustomRolesForViewer(username)
    ];
    return roles.some(r => r != null && roleIdsToCheck.includes(r.id));
}

frontendCommunicator.onAsync("getCustomRoles", async () => customRoles);

frontendCommunicator.on("saveCustomRole", (role) => {
    saveCustomRole(role);
});

frontendCommunicator.on("deleteCustomRole", (roleId) => {
    deleteCustomRole(roleId);
});

exports.triggerUiRefresh = () => {
    frontendCommunicator.send("custom-role-update");
};

exports.getRoleByName = name => {
    const roles = Object.values(customRoles);
    const roleIndex = findIndexIgnoreCase(roles.map(r => r.name), name);
    if (roleIndex < 0) {
        return null;
    }
    return roles[roleIndex];
};
exports.getCustomRoles = () => Object.values(customRoles);

exports.getAllCustomRolesForViewer = getAllCustomRolesForViewer;

exports.loadCustomRoles = loadCustomRoles;

exports.userIsInRole = userIsInRole;

exports.saveCustomRole = saveCustomRole;

exports.deleteCustomRole = deleteCustomRole;

exports.addViewerToRole = addViewerToRole;

exports.removeViewerFromRole = removeViewerFromRole;

exports.removeAllViewersFromRole = removeAllViewersFromRole;









