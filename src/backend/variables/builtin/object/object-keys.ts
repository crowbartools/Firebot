import type { ReplaceVariable } from "../../../../types/variables";
import logger from '../../../logwrapper';


const model : ReplaceVariable = {
    definition: {
        handle: "objectKeys",
        description: "Gets an array of the keys for a given object.",
        usage: "objectKeys[object]",
        categories: ["advanced"],
        possibleDataOutput: ["array"]
    },
    evaluator: (
        _,
        subject: string | object
    ) : unknown => {
        if (typeof subject === 'string' || subject instanceof String) {
            try {
                subject = JSON.parse(`${subject.toString()}`) as object;
            } catch {
                logger.error("Invalid object specified", subject);
                return null;
            }
        }

        if (subject == null || typeof subject !== 'object') {
            logger.error(`$objectKeys[]: subject must be an object or array`);
            return null;
        }

        return Object.keys(subject);
    }
};

export default model;