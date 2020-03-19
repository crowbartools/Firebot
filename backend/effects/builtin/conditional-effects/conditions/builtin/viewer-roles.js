"use strict";

const channelAccess = require("../../../../../common/channel-access");

const firebotRolesManager = require("../../../../../roles/firebot-roles-manager");
const customRolesManager = require("../../../../../roles/custom-roles-manager");
const mixerRolesManager = require("../../../../../../shared/mixer-roles");

module.exports = {
    id: "firebot:viewerroles",
    name: "Viewer's Roles",
    description: "Condition based on a given viewer role",
    comparisonTypes: ["is in role", "isn't in role"],
    leftSideValueType: "text",
    rightSideValueType: "preset",
    getRightSidePresetValues: viewerRolesService => {
        return viewerRolesService.getCustomRoles()
            .concat(viewerRolesService.getMixerRoles())
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
            .concat(viewerRolesService.getMixerRoles())
            .concat(viewerRolesService.getFirebotRoles());

        let role = allRoles.find(r => r.id === condition.rightSideValue);

        return role != null && role.name != null;
    },
    getRightSideValueDisplay: (condition, viewerRolesService) => {
        let allRoles = viewerRolesService.getCustomRoles()
            .concat(viewerRolesService.getMixerRoles())
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

        let mixerUserRoles = await channelAccess.getViewersMixerRoles(username);
        let firebotUserRoles = firebotRolesManager.getAllFirebotRolesForViewer(username) || [];
        let userCustomRoles = customRolesManager.getAllCustomRolesForViewer(username) || [];
        let userMixerRoles = (mixerUserRoles || [])
            .filter(mr => mr !== "User")
            .map(mr => mixerRolesManager.mapMixerRole(mr));

        let allRoles = userCustomRoles.concat(firebotUserRoles).concat(userMixerRoles);

        let hasRole = allRoles.some(r => r.id === rightSideValue);

        switch (comparisonType) {
        case "include":
        case "is in role":
            return hasRole;
        case "doesn't include":
        case "isn't in role":
            return !hasRole;
        default:
            return false;
        }
    }
};