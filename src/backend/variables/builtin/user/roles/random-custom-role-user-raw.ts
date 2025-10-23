import type { ReplaceVariable } from "../../../../../types/variables";
import customRolesManager from "../../../../roles/custom-roles-manager";
import logger from "../../../../logwrapper";
import { getRandomInt } from "../../../../utils";

const model : ReplaceVariable = {
    definition: {
        handle: "rawRandomCustomRoleUser",
        usage: "rawRandomCustomRoleUser[role]",
        description: "Returns a random user that has the specified custom role as an object containing `id`, `username`, and `displayName` properties.",
        categories: ["user based"],
        possibleDataOutput: ["object"],
        hidden: true
    },
    evaluator: (_, role: string) => {
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

        const randIndex = getRandomInt(0, customRole.viewers.length - 1);

        return customRole.viewers[randIndex];
    }
};

export default model;