"use strict";

const firebotRolesManager = require("../../../../../roles/firebot-roles-manager");
const customRolesManager = require("../../../../../roles/custom-roles-manager");
const teamRolesManager = require("../../../../../roles/team-roles-manager");
const twitchRolesManager = require("../../../../../../shared/twitch-roles");
const chatRolesManager = require("../../../../../roles/chat-roles-manager");

module.exports = {
    id: "firebot:viewerroles",
    name: "Viewer's Roles",
    description: "Condition based on a given viewer role",
    comparisonTypes: ["has role", "doesn't have role"],
    leftSideValueType: "text",
    leftSideTextPlaceholder: "Enter username",
    rightSideValueType: "preset",
    getRightSidePresetValues: viewerRolesService => {
        return viewerRolesService.getAllRoles()
            .map(r => ({
                value: r.id,
                display: r.name
            }));
    },
    valueIsStillValid: (condition, viewerRolesService) => {
        const role = viewerRolesService.getAllRoles()
            .find(r => r.id === condition.rightSideValue);

        return role != null && role.name != null;
    },
    getRightSideValueDisplay: (condition, viewerRolesService) => {
        const role = viewerRolesService.getAllRoles()
            .find(r => r.id === condition.rightSideValue);

        if (role) {
            return role.name;
        }

        return condition.rightSideValue;
    },
    predicate: async (conditionSettings, trigger) => {

        const { comparisonType, leftSideValue, rightSideValue } = conditionSettings;

        let username = leftSideValue;
        if (username == null || username === "") {
            username = trigger.metadata.username;
        }

        const userTwitchRoles = (await chatRolesManager.getUsersChatRoles(username))
            .map(twitchRolesManager.mapTwitchRole);
        const userFirebotRoles = firebotRolesManager.getAllFirebotRolesForViewer(username);
        const userCustomRoles = customRolesManager.getAllCustomRolesForViewer(username);
        const userTeamRoles = await teamRolesManager.getAllTeamRolesForViewer(username);

        const allRoles = [
            ...userTwitchRoles,
            ...userFirebotRoles,
            ...userCustomRoles,
            ...userTeamRoles
        ];

        const hasRole = allRoles.some(r => r.id === rightSideValue);

        switch (comparisonType) {
        case "include":
        case "is in role":
        case "has role":
            return hasRole;
        case "doesn't include":
        case "isn't in role":
        case "doesn't have role":
            return !hasRole;
        default:
            return false;
        }
    }
};