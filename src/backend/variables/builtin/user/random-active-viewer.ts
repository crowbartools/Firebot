import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { ReplaceVariable } from "../../../../types/variables";
import activeUserHandler from '../../../chat/chat-listeners/active-user-handler';
import logger from "../../../logwrapper";
import customRolesManager from '../../../roles/custom-roles-manager';
import { getRandomInt } from '../../../utility';

const model : ReplaceVariable = {
    definition: {
        handle: "randomActiveViewer",
        usage: "randomActiveViewer",
        description: "Get a random active chatter's username.",
        examples: [
            {
                usage: "randomActiveViewer[customRolesToInclude, usersToExclude, customRolesToExclude, username|id|raw]",
                description: "Get a random active chatter that is a member of the custom role(s), ignoring the excluded username(s) and members in the excluded role(s)."
            },
            {
                usage: "randomActiveViewer[roleName]",
                description: "Filter to an active viewer in a specific role."
            },
            {
                usage: "randomActiveViewer[null, ignoreUser]",
                description: "Get a random active user that is NOT the ignored user."
            },
            {
                usage: "randomActiveViewer[$arrayFrom[roleOne, roleTwo], $arrayFrom[$streamer, $bot], $arrayFrom[roleC, roleD]]",
                description: "Filter to members of roleOne or roleTwo, excluding streamer and bot, and excluding any members of roleC or roleD."
            },
            {
                usage: "randomActiveViewer[null, null, null, id]",
                description: "Get the unique user ID for a random active chatter."
            },
            {
                usage: "randomActiveViewer[null, null, null, raw]",
                description: "Get an object representing a random active chatter. The result will include `username` and `id` properties."
            }
        ],
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.OBJECT]
    },
    evaluator: async (_trigger, roles?: string | string[], ignoreUsers?: string | string[], ignoreRoles?: string | string[], propName?: string) => {
        const failResult = "[Unable to get random active user]";
        logger.debug("Getting random active viewer...");

        const activeViewerCount = activeUserHandler.getActiveUserCount();
        if (activeViewerCount === 0) {
            logger.debug("randomActiveViewer: no active viewers are available to select from");
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
            const unkOrExcRoleNames = includedRoleNames
                .filter(roleName => !includedRoles.some(role => role.name.toLowerCase() === roleName?.toLowerCase()))
                .join(", ");

            // warn and return early if /all/ included roles are unknown or excluded
            if (includedRoles.length === 0) {
                logger.warn(`randomActiveViewer filtering solely to unknown or excluded role(s): ${unkOrExcRoleNames}`);
                return failResult;
            }
            // otherwise, warn if any roles are unknown
            logger.warn(`randomActiveViewer ignoring unknown or also-excluded role(s): ${unkOrExcRoleNames}`);
        }

        if (excludedRoleNames.length > excludedRoles.length) {
            const unknownRoleNames = excludedRoleNames
                .filter(roleName => !excludedRoles.some(role => role.name.toLowerCase() === roleName.toLowerCase()));
            logger.warn(`randomActiveViewer ignoring unknown excluded role(s): ${unknownRoleNames.join(", ")}`);
        }

        let selectableViewers = activeUserHandler.getAllActiveUsers();
        if (excludedUserNames.length > 0) {
            selectableViewers = selectableViewers.filter(user => !excludedUserNames.includes(user.username));
        }
        if (excludedRoles.length > 0) {
            const excludedRoleIds = excludedRoles.map(role => role.id);
            selectableViewers = selectableViewers.filter(user => !customRolesManager.userIsInRole(user.id, [], excludedRoleIds));
        }
        if (includedRoles.length > 0) {
            const includedRoleIds = includedRoles.map(role => role.id);
            selectableViewers = selectableViewers.filter(user => customRolesManager.userIsInRole(user.id, [], includedRoleIds));
        }

        if (selectableViewers.length > 0) {
            const randIndex = getRandomInt(0, selectableViewers.length - 1);
            switch (propName?.toLowerCase()) {
                case "id":
                    return selectableViewers[randIndex].id;
                case "raw":
                    return selectableViewers[randIndex];
                case "username":
                default:
                    return selectableViewers[randIndex].username;
            }
        }

        logger.warn(`randomActiveViewer failed to get a user; +${activeViewerCount}/-${
            excludedUserNames.length} viewers, +${includedRoles.length}/-${excludedRoles.length} roles`);
        return failResult;
    }
};

export default model;
