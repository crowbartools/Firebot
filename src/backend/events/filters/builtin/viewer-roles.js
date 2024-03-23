"use strict";

const customRolesManager = require("../../../roles/custom-roles-manager");
const teamRolesManager = require("../../../roles/team-roles-manager");
const twitchRolesManager = require("../../../../shared/twitch-roles");
const chatRolesManager = require("../../../roles/chat-roles-manager");
const twitchApi = require("../../../twitch-api/api");

module.exports = {
    id: "firebot:viewerroles",
    name: "Viewer's Roles",
    description: "Filter to a given viewer role",
    events: [
        { eventSourceId: "twitch", eventId: "cheer" },
        { eventSourceId: "twitch", eventId: "subs-gifted" },
        { eventSourceId: "twitch", eventId: "sub" },
        { eventSourceId: "twitch", eventId: "prime-sub-upgraded" },
        { eventSourceId: "twitch", eventId: "gift-sub-upgraded" },
        { eventSourceId: "twitch", eventId: "follow" },
        { eventSourceId: "streamlabs", eventId: "follow" },
        { eventSourceId: "twitch", eventId: "raid" },
        { eventSourceId: "twitch", eventId: "viewer-arrived" },
        { eventSourceId: "twitch", eventId: "chat-message" },
        { eventSourceId: "twitch", eventId: "whisper" },
        { eventSourceId: "streamloots", eventId: "purchase" },
        { eventSourceId: "streamloots", eventId: "redemption" },
        { eventSourceId: "firebot", eventId: "view-time-update" }
    ],
    comparisonTypes: ["include", "doesn't include"],
    valueType: "preset",
    presetValues: (viewerRolesService) => {
        return viewerRolesService
            .getCustomRoles()
            .concat(viewerRolesService.getTwitchRoles())
            .concat(viewerRolesService.getTeamRoles())
            .map(r => ({value: r.id, display: r.name}));

    },
    valueIsStillValid: (filterSettings, viewerRolesService) => {
        const allRoles = viewerRolesService
            .getCustomRoles()
            .concat(viewerRolesService.getTeamRoles())
            .concat(viewerRolesService.getTwitchRoles());

        const role = allRoles.find(r => r.id === filterSettings.value);

        return role != null && role.name != null;
    },
    getSelectedValueDisplay: (filterSettings, viewerRolesService) => {
        const allRoles = viewerRolesService.getCustomRoles()
            .concat(viewerRolesService.getTeamRoles())
            .concat(viewerRolesService.getTwitchRoles());

        const role = allRoles.find(r => r.id === filterSettings.value);

        if (role) {
            return role.name;
        }

        return filterSettings.value;
    },

    predicate: async (filterSettings, eventData) => {
        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        const { username } = eventMeta;
        let { userId } = eventMeta;

        if (!username && !userId) {
            return false;
        }

        try {
            if (userId == null) {
                const user = await twitchApi.users.getUserByName(username);

                if (user == null) {
                    return false;
                }

                userId = user.id;
            }

            /** @type {string[]} */
            let twitchUserRoles = eventMeta.twitchUserRoles;

            // For sub tier-specific/known bot permission checking, we have to get live data
            if (twitchUserRoles == null
                || value === "tier1"
                || value === "tier2"
                || value === "tier3"
                || value === "viewerlistbot"
            ) {
                twitchUserRoles = await chatRolesManager.getUsersChatRoles(userId);
            }

            const userCustomRoles = customRolesManager.getAllCustomRolesForViewer(userId) || [];
            const userTeamRoles = await teamRolesManager.getAllTeamRolesForViewer(userId) || [];
            const userTwitchRoles = (twitchUserRoles || [])
                .map(twitchRolesManager.mapTwitchRole);

            const allRoles = [
                ...userTwitchRoles,
                ...userTeamRoles,
                ...userCustomRoles
            ].filter(r => r != null);

            const hasRole = allRoles.some(r => r.id === value);

            switch (comparisonType) {
                case "include":
                    return hasRole;
                case "doesn't include":
                    return !hasRole;
                default:
                    return false;
            }
        } catch {
            // Silently fail
        }

        return false;
    }
};