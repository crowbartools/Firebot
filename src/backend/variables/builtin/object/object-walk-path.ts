import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";


const logger = require('../../../logwrapper');

const model : ReplaceVariable = {
    definition: {
        handle: "objectWalkPath",
        description: "Returns the value from an object at the given dot-notated path",
        usage: "objectWalkPath[subject | JSON text, path.to.value]",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_: unknown, subject: unknown, propertyPath: string | Array<string | number>) : unknown => {
        if (typeof subject == 'string' || subject instanceof String) {
            try {
                subject = JSON.parse(`${subject}`);
            } catch (err) {
                return;
            }
        }
        if (subject == null) {
            return;
        }

        let nodes : Array<string | number>;
        if (typeof propertyPath === 'string' || propertyPath instanceof String) {
            nodes = propertyPath
                .split(/\./g)
                .map((node) => {
                    if (Number.isFinite(Number(node))) {
                        return Number(node);
                    }
                    return node;
                });

        } else if (propertyPath == null || !Array.isArray(propertyPath) || propertyPath.length < 1) {
            logger.error("$objectWalkPath: property path must be specified");
            return;

        } else {
            nodes = propertyPath;
        }

        let cursor = subject;
        while (nodes.length) {
            cursor = subject[nodes.shift()];
            if (cursor == null) {
                return;
            }
        }
        return cursor;
    }
};

export default model;