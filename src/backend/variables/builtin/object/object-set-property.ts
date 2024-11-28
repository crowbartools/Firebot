import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const logger = require('../../../logwrapper');

const model : ReplaceVariable = {
    definition: {
        handle: "setObjectProperty",
        description: "Adds or updates a property's value in the given JSON object. For nested properties, you can use dot notation (e.g. some.property). Set value to null to remove property.",
        usage: "setObjectProperty[object, propertyPath, value]",
        examples: [
            {
                usage: `setObjectProperty[{"name": "John"}, age, 25]`,
                description: `Adds/updates the age property to 25. Result: {"name": "John", "age": 25}`
            },
            {
                usage: `setObjectProperty[{"user": {"name": "John"}}, user.age, 25]`,
                description: `Adds/updates a nested property using dot notation. Result: {"user": {"name": "John", "age": 25}}`
            },
            {
                usage: `setObjectProperty[{"name": "John", "age": 25}, age, null]`,
                description: `Removes the age property. Result: {"name": "John"}`
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        subject: string | unknown,
        propertyPath: string | Array<string | number>,
        value: unknown
    ) : unknown => {

        if (typeof subject === 'string' || subject instanceof String) {
            try {
                subject = JSON.parse(`${subject}`);
            } catch (err) {
                logger.error("Invalid object specified", subject);
                return null;
            }
        }

        if (subject == null || typeof subject !== 'object') {
            logger.error(`$getObjectProperty[]: subject must be an object or array`);
            return null;
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
            logger.error("Property path must be specified");
            return null;

        } else {
            nodes = propertyPath;
        }

        // walk subject
        let currentSubject = subject,
            key : string | number = nodes.shift();
        do {
            if (currentSubject == null || typeof currentSubject !== 'object') {
                logger.error(`$getObjectProperty[]: walked path leads to invalid`);
                return null;
            }
            if (nodes.length > 0) {
                currentSubject = currentSubject[key];
                key = nodes.shift();
            }
        } while (nodes.length);

        if (value == null) {
            if (Array.isArray(currentSubject)) {
                currentSubject.splice(<number>key, 1);
            } else {
                delete currentSubject[key];
            }
        } else {
            currentSubject[key] = value;
        }

        return subject;
    }
};

export default model;