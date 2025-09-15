import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import customRolesManager from "../../../../roles/custom-roles-manager";
import util from "../../../../utility";
import logger from "../../../../logwrapper";

const model : ReplaceVariable = {
    definition: {
        handle: "rawRandomCustomRoleUser",
        usage: "rawRandomCustomRoleUser[role]",
        description: "Returns a random user that has the specified custom role as an object containing `id`, `username`, and `displayName` properties.",
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.OBJECT],
        hidden: true
    },
    evaluator: async (_, role: string) => {
        if (role == null || role === '') {
            logger.debug("Unable to evaluate rawRandomCustomRoleUser. No custom role specified");
            return null;
        }

        const customRole = customRolesManager.getRoleByName(role);

        if (customRole == null) {
            logger.debug(`Unable to evaluate rawRandomCustomRoleUser. Custom role ${role} does not exist`);
            return null;
        }

        if (customRole.viewers.length === 0) {
            logger.debug(`Custom role ${role} has no viewers`);
            return null;
        }

        const randIndex = util.getRandomInt(0, customRole.viewers.length - 1);

        return customRole.viewers[randIndex];
    }
};

export default model;