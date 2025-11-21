import type { ReplaceVariable } from "../../../../types/variables";
import { ActiveUserHandler } from "../../../chat/active-user-handler";
import customRolesManager from "../../../roles/custom-roles-manager";
import logger from "../../../logwrapper";

const model : ReplaceVariable = {
    definition: {
        handle: "chatUserCount",
        description: "Get the total number of current viewers in chat, both active and lurking.",
        categories: ["numbers"],
        possibleDataOutput: ["number"],
        examples: [
            {
                usage: "chatUserCount[CustomRole]",
                description: "Gets the total number of current chat viewers in the specified custom role."
            }
        ]
    },
    evaluator: (_, ...args: string[]) => {
        logger.debug("Getting number of current viewers in chat.");

        if (args && args.length >= 1 && args[0] && args[0] !== "" && `${args[0]}`.toLowerCase() !== "null") {
            const customRole = customRolesManager.getRoleByName(`${args[0]}`);
            if (customRole == null) {
                logger.warn(`Unable to get custom role from name ${args[0]}`);
                return 0;
            }

            const customRoleUsers = customRole.viewers.map(crv => crv.username);
            if (customRoleUsers.length === 0) {
                logger.warn(`Custom role named ${customRole.name} appears to be empty`);
                return 0;
            }

            const totalCustomRoleUsers = ActiveUserHandler.getAllOnlineUsers().filter(user => customRoleUsers.includes(user.username));
            return totalCustomRoleUsers.length;
        }

        return ActiveUserHandler.getOnlineUserCount() || 0;
    }
};

export default model;
