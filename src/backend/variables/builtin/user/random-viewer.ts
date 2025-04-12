import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import activeUserHandler from "../../../chat/chat-listeners/active-user-handler";
import logger from "../../../logwrapper";
import customRolesManager from "../../../roles/custom-roles-manager";
import { getRandomInt } from "../../../utility";

const model : ReplaceVariable = {
    definition: {
        handle: "randomViewer",
        description: "Get a random viewer's username that is presently in your channel's chat.",
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.OBJECT],
        examples: [
            {
                usage: "randomViewer[customRolesToInclude, usersToExclude, customRolesToExclude, username|displayName|id|raw]",
                description: "Get a random online viewer that is a member of the custom role(s), ignoring the excluded username(s) and members in the excluded role(s)."
            },
            {
                usage: "randomViewer[roleOne, $streamer, null, displayName]",
                description: "Get a random online viewer's display name that is a member of the roleOne custom role, excluding your own user name."
            },
            {
                usage: "randomViewer[null, ebiggz, roleC, id]",
                description: "Get a random online viewer's unique user id, excluding ebiggz, and excluding any members of the roleC custom role."
            },
            {
                usage: "randomViewer[$arrayFrom[roleOne, roleTwo], $arrayFrom[$streamer, $bot], $arrayFrom[roleC, roleD]]",
                description: "Filter to members of roleOne or roleTwo, excluding your own streamer and bot accounts, and excluding any members of roleC or roleD."
            },
            {
                usage: "randomViewer[null, null, null, raw]",
                description: "Get an object representing an online viewer. The result will include `username`, `displayName` and `id` properties."
            }
        ]
    },
    evaluator: (_, roles?: string | string[], ignoreUsers?: string | string[], ignoreRoles?: string | string[], propName?: string) => {
        const failResult = "[Unable to get random viewer]";
        logger.debug("Getting random viewer...");

        const onlineViewerCount = activeUserHandler.getOnlineUserCount();

        if (onlineViewerCount === 0) {
            logger.warn("randomViewer: no online viewers are available to select from");
            return failResult;
        }

        function parseArg(param?: string | string[]): string[] {
            if (param != null) {
                if (Array.isArray(param)) {
                    return [...new Set(param.filter(p => p != null))]; // defensive de-duplication
                } else if (typeof param === "string" && param.toLowerCase() !== "null") {
                    return [param];
                }
            }
            return [];
        }

        const excludedUserNames = parseArg(ignoreUsers);
        const excludedRoleNames = parseArg(ignoreRoles);
        const includedRoleNames = parseArg(roles);

        const excludedRoles = excludedRoleNames
            .map(roleName => customRolesManager.getRoleByName(roleName))
            .filter(role => role != null);
        const includedRoles = includedRoleNames
            .map(roleName => customRolesManager.getRoleByName(roleName))
            .filter(role => role != null && !excludedRoles.some(er => er.id === role.id));

        if (includedRoleNames.length > includedRoles.length) {
            // If user asked for a member of solely unknown/excluded roles, honor that.
            const isFatal = includedRoles.length === 0;
            const desc = isFatal ? "all included role(s)" : "ignoring included role(s) that";
            const unkOrExclRoleNames = includedRoleNames
                .filter(roleName => !includedRoles.some(role => role.name.toLowerCase() === roleName.toLowerCase()));

            logger.warn(`randomViewer ${desc} are unknown, or are also excluded: ${unkOrExclRoleNames.join(", ")}`);

            if (isFatal) {
                return failResult;
            }
        }

        if (excludedRoleNames.length > excludedRoles.length) {
            const unknownRoleNames = excludedRoleNames
                .filter(roleName => !excludedRoles.some(role => role.name.toLowerCase() === roleName.toLowerCase()));
            logger.warn(`randomViewer ignoring unknown excluded role(s): ${unknownRoleNames.join(", ")}`);
        }

        let selectableUsers = activeUserHandler.getAllOnlineUsers();
        if (excludedUserNames.length > 0) {
            selectableUsers = selectableUsers.filter(user => !excludedUserNames.includes(user.username));
        }
        if (excludedRoles.length > 0) {
            const excludedRoleIds = excludedRoles.map(role => role.id);
            selectableUsers = selectableUsers.filter(user => !customRolesManager.userIsInRole(user.id, [], excludedRoleIds));
        }
        if (includedRoles.length > 0) {
            const includedRoleIds = includedRoles.map(role => role.id);
            selectableUsers = selectableUsers.filter(user => customRolesManager.userIsInRole(user.id, [], includedRoleIds));
        }

        if (selectableUsers.length > 0) {
            const randIndex = getRandomInt(0, selectableUsers.length - 1);
            const winner = selectableUsers[randIndex];
            switch (propName?.toLowerCase()) {
                case "displayname":
                    return winner.displayName;
                case "id":
                    return winner.id;
                case "raw":
                    return {
                        displayName: winner.displayName,
                        id: winner.id,
                        username: winner.username
                    };
                default:
                case "username":
                    return winner.username;
            }
        }

        logger.warn(`randomViewer failed to get a user; +${onlineViewerCount}/-${
            excludedUserNames.length} viewers, +${includedRoles.length}/-${excludedRoles.length} roles`);
        return failResult;
    }
};

export default model;
