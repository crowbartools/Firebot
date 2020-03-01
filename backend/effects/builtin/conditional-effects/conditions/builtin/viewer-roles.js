"use strict";

const channelAccess = require("../../../../../common/channel-access");

const customRolesManager = require("../../../../../roles/custom-roles-manager");
const mixerRolesManager = require("../../../../../../shared/mixer-roles");

module.exports = {
    id: "firebot:viewerroles",
    name: "Viewer's Roles",
    description: "Condition based on a given viewer role",
    comparisonTypes: ["include", "doesn't include"],
    leftSideValueType: "none",
    rightSideValueType: "preset",
    getRightSidePresetValues: viewerRolesService => {
        return viewerRolesService.getCustomRoles()
            .concat(viewerRolesService.getMixerRoles())
            .map(r => {
                return {
                    value: r.id,
                    display: r.name
                };
            });
    },
    valueIsStillValid: (condition, viewerRolesService) => {
        let allRoles = viewerRolesService.getCustomRoles()
            .concat(viewerRolesService.getMixerRoles());

        let role = allRoles.find(r => r.id === condition.rightSideValue);

        return role != null && role.name != null;
    },
    getRightSideValueDisplay: (condition, viewerRolesService) => {
        let allRoles = viewerRolesService.getCustomRoles()
            .concat(viewerRolesService.getMixerRoles());

        let role = allRoles.find(r => r.id === condition.rightSideValue);

        if (role) {
            return role.name;
        }

        return condition.rightSideValue;
    },
    predicate: async (conditionSettings, trigger) => {

        let { comparisonType, rightSideValue } = conditionSettings;

        let username = trigger.metadata.username;
        if (username == null || username === "") {
            return false;
        }

        let mixerUserRoles = await channelAccess.getViewersMixerRoles(username);

        let userCustomRoles = customRolesManager.getAllCustomRolesForViewer(username) || [];
        let userMixerRoles = (mixerUserRoles || [])
            .filter(mr => mr !== "User")
            .map(mr => mixerRolesManager.mapMixerRole(mr));

        let allRoles = userCustomRoles.concat(userMixerRoles);

        let hasRole = allRoles.some(r => r.id === rightSideValue);

        switch (comparisonType) {
        case "include":
            return hasRole;
        case "doesn't include":
            return !hasRole;
        default:
            return false;
        }
    }
};