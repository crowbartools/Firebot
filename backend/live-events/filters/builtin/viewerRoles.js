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
        { eventSourceId: "mixer", eventId: "user-joined-chat" },
        { eventSourceId: "mixer", eventId: "user-left-chat" },
        { eventSourceId: "mixer", eventId: "messages-purged" },
        { eventSourceId: "mixer", eventId: "user-banned" },
        { eventSourceId: "mixer", eventId: "skill" }
    ],
    comparisonTypes: ["include", "doesn't include"],
    valueType: "preset",
    presetValues: (viewerRolesService) => {
        return new Promise(resolve => {
            let allRoles = viewerRolesService.getCustomRoles()
                .concat(viewerRolesService.getMixerRoles())
                .map(r => {
                    return {
                        value: r.id,
                        display: r.name
                    };
                });
            resolve(allRoles);
        });
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
    predicate: (filterSettings, eventData) => {
        return new Promise(async resolve => {

            let { comparisonType, value } = filterSettings;
            let { eventMeta } = eventData;

            let username = eventMeta.username;
            if (username == null || username === "") {
                return resolve(false);
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
                return resolve(hasRole);
            case "doesn't include":
                return resolve(!hasRole);
            default:
                return resolve(false);
            }
        });
    }
};