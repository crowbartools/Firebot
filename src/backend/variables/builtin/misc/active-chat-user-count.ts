import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { getActiveUserCount, getAllActiveUsers } from "../../../chat/chat-listeners/active-user-handler";
import customRolesManager from "../../../roles/custom-roles-manager";
import logger from "../../../logwrapper";

const model : ReplaceVariable = {
    definition: {
        handle: "activeChatUserCount",
        description: "Get the number of active viewers in chat.",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER],
        examples: [
            {
                usage: "activeChatUserCount[CustomRole]",
                description: "Gets the number of active viewers in the specified custom role."
            }
        ]
    },
    evaluator: async (_, ...args: unknown[]) => {
        logger.debug("Getting number of active viewers in chat.");

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

            const activeCustomRoleUsers = getAllActiveUsers().filter(user => customRoleUsers.includes(user.username));
            return activeCustomRoleUsers.length;
        }

        return getActiveUserCount() || 0;
    }
};

export default model;
