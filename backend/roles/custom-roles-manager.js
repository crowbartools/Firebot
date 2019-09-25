"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const profileManager = require("../common/profile-manager");
const frontendCommunicator = require("../common/frontend-communicator");

let customRoles = {};

const ROLES_FOLDER = "/roles/";
function getCustomRolesDb() {
    return profileManager.getJsonDbInProfile(ROLES_FOLDER + "customroles");
}

/*
{
    "roleId": {
        name: "Some Role",
        id: "roleId",
        viewers: []
    }
}
*/

function loadCustomRoles() {
    logger.debug(`Attempting to load roles data...`);

    let rolesDb = getCustomRolesDb();

    try {
        let customRolesData = rolesDb.getData("/");

        if (customRolesData) {
            customRoles = customRolesData;
        }

        logger.debug(`Loaded roles data.`);

    } catch (err) {
        logger.warn(`There was an error reading roles data file.`, err);
    }
}

function saveCustomRole(role) {
    if (role == null) return;

    customRoles[role.id] = role;

    try {
        let rolesDb = getCustomRolesDb();

        rolesDb.push("/" + role.id, role);

        logger.debug(`Saved role ${role.id} to file.`);

    } catch (err) {
        logger.warn(`There was an error saving a role.`, err);
    }
}

function deleteCustomRole(roleId) {
    if (roleId == null) return;

    delete customRoles[roleId];

    try {
        let rolesDb = getCustomRolesDb();

        rolesDb.delete("/" + roleId);

        logger.debug(`Deleted role: ${roleId}`);

    } catch (err) {
        logger.warn(`There was an error saving a role.`, err);
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
    let role = customRoles[roleId];
    if (role) {
        if (findIndexIgnoreCase(role.viewers, username) !== -1) return;

        role.viewers.push(username);

        saveCustomRole(role);
    }
}

function removeViewerToRole(roleId, username) {
    let role = customRoles[roleId];
    if (role) {
        const index = findIndexIgnoreCase(role.viewers, username);

        if (index === -1) return;

        role.viewers.splice(index, 1);

        saveCustomRole(role);
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

frontendCommunicator.onAsync("getCustomRoles", () => {
    return new Promise(resolve => {
        resolve(customRoles);
    });
});

frontendCommunicator.on("saveCustomRole", (role) => {
    saveCustomRole(role);
});

frontendCommunicator.on("deleteCustomRole", (roleId) => {
    deleteCustomRole(roleId);
});

exports.getAllCustomRolesForViewer = getAllCustomRolesForViewer;

exports.loadCustomRoles = loadCustomRoles;










