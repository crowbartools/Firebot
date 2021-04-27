"use strict";

const twitchUsers = require("../../../../../twitch-api/resource/users");
const firebotRolesManager = require("../../../../../roles/firebot-roles-manager");
const customRolesManager = require("../../../../../roles/custom-roles-manager");
const teamRolesManager = require("../../../../../roles/team-roles-manager");
const twitchRolesManager = require("../../../../../../shared/twitch-roles");

module.exports = {
    id: "firebot:viewerroles",
    name: "Viewer's Roles",
    description: "Condition based on a given viewer role",
    comparisonTypes: ["has role", "doesn't have role"],
    leftSideValueType: "text",
    leftSideTextPlaceholder: "Enter username",
    rightSideValueType: "preset",
    getRightSidePresetValues: viewerRolesService => {
        return viewerRolesService.getCustomRoles()
            .concat(viewerRolesService.getTwitchRoles())
            .concat(viewerRolesService.getTeamRoles())
            .concat(viewerRolesService.getFirebotRoles())
            .map(r => {
                return {
                    value: r.id,
                    display: r.name
                };
            });
    },
    valueIsStillValid: (condition, viewerRolesService) => {
        let allRoles = viewerRolesService.getCustomRoles()
            .concat(viewerRolesService.getTwitchRoles())
            .concat(viewerRolesService.getTeamRoles())
            .concat(viewerRolesService.getFirebotRoles());

        let role = allRoles.find(r => r.id === condition.rightSideValue);

        return role != null && role.name != null;
    },
    getRightSideValueDisplay: (condition, viewerRolesService) => {
        let allRoles = viewerRolesService.getCustomRoles()
            .concat(viewerRolesService.getTwitchRoles())
            .concat(viewerRolesService.getTeamRoles())
            .concat(viewerRolesService.getFirebotRoles());

        let role = allRoles.find(r => r.id === condition.rightSideValue);

        if (role) {
            return role.name;
        }

        return condition.rightSideValue;
    },
    predicate: async (conditionSettings, trigger) => {

        let { comparisonType, leftSideValue, rightSideValue } = conditionSettings;
        let username = leftSideValue;

        if (username == null || username === "") {
            username = trigger.metadata.username;
        }

        let twitchUserRoles = null;
        if (twitchUserRoles == null) {
            twitchUserRoles = await twitchUsers.getUsersChatRoles(username);
        }

        let firebotUserRoles = firebotRolesManager.getAllFirebotRolesForViewer(username) || [];
        let userCustomRoles = customRolesManager.getAllCustomRolesForViewer(username) || [];
        let userTeamRoles = teamRolesManager.getAllTeamRolesForViewer(username) || [];
        let userTwitchRoles = (twitchUserRoles || [])
            .map(r => twitchRolesManager.mapTwitchRole(r));

        let allRoles = userCustomRoles.concat(firebotUserRoles).concat(userTwitchRoles).concat(userTeamRoles);

        let hasRole = allRoles.some(r => r.id === rightSideValue);

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