"use strict";

const channelAccess = require("../../../common/channel-access");

const customRolesManager = require("../../../roles/custom-roles-manager");
const mixerRolesManager = require("../../../../shared/mixer-roles");

module.exports = {
    id: "firebot:viewerroles",
    name: "Viewer's Roles",
    description: "Filter to a given viewer role",
    events: [
        { eventSourceId: "mixer", eventId: "chat-message" },
        { eventSourceId: "mixer", eventId: "subscribed" },
        { eventSourceId: "mixer", eventId: "resub" },
        { eventSourceId: "mixer", eventId: "hosted" },
        { eventSourceId: "mixer", eventId: "followed" },
        { eventSourceId: "mixer", eventId: "user-joined-mixplay" },
        { eventSourceId: "mixer", eventId: "user-joined-chat" },
        { eventSourceId: "mixer", eventId: "user-left-chat" },
        { eventSourceId: "mixer", eventId: "messages-purged" },
        { eventSourceId: "mixer", eventId: "user-banned" },
        { eventSourceId: "mixer", eventId: "skill" },
        { eventSourceId: "mixer", eventId: "viewer-arrived" },
        { eventSourceId: "streamloots", eventId: "purchase" },
        { eventSourceId: "streamloots", eventId: "redemption" },
        { eventSourceId: "firebot", eventId: "view-time-update" }
    ],
    comparisonTypes: ["include", "doesn't include"],
    valueType: "preset",
    presetValues: viewerRolesService => {
        return viewerRolesService
            .getCustomRoles()
            .concat(viewerRolesService.getMixerRoles())
            .map(r => ({value: r.id, display: r.name}));

    },
    valueIsStillValid: (filterSettings, viewerRolesService) => {
        let allRoles = viewerRolesService
            .getCustomRoles()
            .concat(viewerRolesService.getMixerRoles());

        let role = allRoles.find(r => r.id === filterSettings.value);

        return role != null && role.name != null;
    },
    getSelectedValueDisplay: (filterSettings, viewerRolesService) => {
        let allRoles = viewerRolesService.getCustomRoles()
            .concat(viewerRolesService.getMixerRoles());

        let role = allRoles.find(r => r.id === filterSettings.value);

        if (role) {
            return role.name;
        }

        return filterSettings.value;
    },
    predicate: async (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        let username = eventMeta.username;
        if (username == null || username === "") {
            return false;
        }

        let mixerUserRoles = eventMeta.data && (eventMeta.data.user_roles || eventMeta.data.userRoles);
        if (mixerUserRoles == null) {
            mixerUserRoles = await channelAccess.getViewersMixerRoles(username);
        }

        let userCustomRoles = customRolesManager.getAllCustomRolesForViewer(username) || [];
        let userMixerRoles = (mixerUserRoles || [])
            .filter(mr => mr !== "User")
            .map(mr => mixerRolesManager.mapMixerRole(mr));

        let allRoles = userCustomRoles.concat(userMixerRoles);

        let hasRole = allRoles.some(r => r.id === value);

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