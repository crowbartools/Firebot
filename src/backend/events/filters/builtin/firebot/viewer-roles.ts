import customRolesManager from "../../../../roles/custom-roles-manager";
import teamRolesManager from "../../../../roles/team-roles-manager";
import twitchRolesManager from "../../../../../shared/twitch-roles";
import chatRolesManager from "../../../../roles/chat-roles-manager";
import twitchApi from "../../../../twitch-api/api";
import { EventFilter } from "../../../../../types/events";

const filter: EventFilter = {
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
        { eventSourceId: "firebot", eventId: "view-time-update" },
        { eventSourceId: "firebot", eventId: "viewer-rank-updated" },
        { eventSourceId: "firebot", eventId: "currency-update" }
    ],
    comparisonTypes: ["include", "doesn't include"],
    valueType: "preset",
    presetValues: (viewerRolesService: any) => {
        return viewerRolesService
            .getCustomRoles()
            .concat(viewerRolesService.getTwitchRoles())
            .concat(viewerRolesService.getTeamRoles())
            .map(r => ({ value: r.id, display: r.name }));
    },
    valueIsStillValid: (filterSettings, viewerRolesService: any) => {
        const allRoles = viewerRolesService
            .getCustomRoles()
            .concat(viewerRolesService.getTeamRoles())
            .concat(viewerRolesService.getTwitchRoles());

        const role = allRoles.find(r => r.id === filterSettings.value);

        return role != null && role.name != null;
    },
    getSelectedValueDisplay: (filterSettings, viewerRolesService: any) => {
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

        const username = eventMeta.username as string;
        let userId = eventMeta.userId as string;

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

            let twitchUserRoles = eventMeta.twitchUserRoles as string[];

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

export default filter;