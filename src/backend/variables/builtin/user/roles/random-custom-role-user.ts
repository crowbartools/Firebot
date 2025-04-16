import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import customRolesManager from "../../../../roles/custom-roles-manager";
import logger from "../../../../logwrapper";
import util from "../../../../utility";

const model : ReplaceVariable = {
    definition: {
        handle: "randomCustomRoleUser",
        usage: "randomCustomRoleUser[role]",
        description: "Returns a random user's display name that is in any of the specified custom role(s).",
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.OBJECT],
        examples: [
            {
                usage: "randomCustomRoleUser[customRolesToInclude, usersToExclude, customRolesToExclude, displayName|username|id|raw]",
                description: "Get a random user that is in any of the included role(s), ignoring the excluded username(s) or members in the excluded role(s)."
            },
            {
                usage: "randomCustomRoleUser[roleOne, $streamer]",
                description: "Get a random user's display name that is a member of roleOne, excluding your own streamer's account."
            },
            {
                usage: "randomCustomRoleUser[roleOne, null, roleC, username]",
                description: "Get the username of a random member of roleOne, excluding any member of roleC."
            },
            {
                usage: "randomCustomRoleUser[$arrayFrom[roleOne, roleTwo], $arrayFrom[$streamer, $bot], $arrayFrom[roleC, roleD]]",
                description: "Get the display name of a member of roleOne or roleTwo, excluding streamer and bot, and excluding any members of roleC or roleD."
            },
            {
                usage: "randomCustomRoleUser[roleOne, null, null, raw]",
                description: "Get an object representing a random member of roleOne. The result will include `displayName`, `username`, and `id` properties."
            }
        ]
    },
    evaluator: async (_, roles: string | string[], ignoreUsers?: string | string[], ignoreRoles?: string | string[], propName?: string) => {
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

        const failResult: Readonly<{noRoles: string; noUsers: string;}> = {
            noRoles: "[No custom role specified]",
            noUsers: ""
        };

        const excludedUserNames = parseArg(ignoreUsers);
        const excludedRoleNames = parseArg(ignoreRoles);
        const includedRoleNames = parseArg(roles);

        if (includedRoleNames.length === 0) {
            logger.warn("randomCustomRoleUser: no custom roles specified");
            return failResult.noRoles;
        }

        const excludedRoles = excludedRoleNames
            .map(roleName => customRolesManager.getRoleByName(roleName))
            .filter(role => role != null);
        const includedRoles = includedRoleNames
            .map(roleName => customRolesManager.getRoleByName(roleName))
            .filter(role => role != null && !excludedRoles.some(er => er.id === role.id));

        if (includedRoles.length === 0) {
            logger.warn(`randomCustomRoleUser: filtering solely to unknown or excluded role(s): ${includedRoleNames.join(", ")}`);
            return failResult.noRoles;
        } else if (includedRoles.every(role => role.viewers.length === 0)) {
            logger.warn(`randomCustomRoleUser: all role(s) are empty: ${includedRoles.map(role => role.name).join(", ")}`);
            return failResult.noUsers;
        } else if (includedRoleNames.length > includedRoles.length) {
            const unknownRoleNames = includedRoleNames
                .filter(roleName => !includedRoles.some(role => role.name.toLowerCase() === roleName.toLowerCase()));
            logger.warn(`randomCustomRoleUser: ignoring unknown or also-excluded role(s): ${unknownRoleNames.join(", ")}`);
        }

        if (excludedRoleNames.length > excludedRoles.length) {
            const unknownRoleNames = excludedRoleNames
                .filter(roleName => !excludedRoles.some(role => role.name.toLowerCase() === roleName.toLowerCase()));
            logger.warn(`randomCustomRoleUser: ignoring unknown excluded role(s): ${unknownRoleNames.join(", ")}`);
        }

        let selectableUsers = includedRoles.flatMap(role => role.viewers).filter((user, idx, arr) => {
            return arr.findIndex(u => u.id === user.id) === idx;
        });
        if (excludedUserNames.length > 0) {
            selectableUsers = selectableUsers.filter(user => !excludedUserNames.includes(user.username));
        }
        if (excludedRoles.length > 0) {
            const excludedRoleIds = excludedRoles.map(role => role.id);
            selectableUsers = selectableUsers.filter(user => !customRolesManager.userIsInRole(user.id, [], excludedRoleIds));
        }

        if (selectableUsers.length > 0) {
            const randIndex = util.getRandomInt(0, selectableUsers.length - 1);
            switch (propName?.toLowerCase()) {
                case "id":
                    return selectableUsers[randIndex].id;
                case "raw":
                    return selectableUsers[randIndex];
                case "username":
                    return selectableUsers[randIndex].username;
                // Back-compat; *should* ideally default to username
                default:
                case "displayname":
                    return selectableUsers[randIndex].displayName;
            }
        }

        logger.warn(`randomCustomRoleUser: failed to get a user; +${includedRoles.length}/-${
            excludedRoles.length} roles, -${excludedUserNames.length} users`);
        return failResult.noUsers;
    }
};

export default model;