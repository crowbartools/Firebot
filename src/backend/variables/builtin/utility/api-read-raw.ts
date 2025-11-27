import type { ReplaceVariable, Trigger } from "../../../../types/variables";

import readApi from './api-read';

const model: ReplaceVariable = {
    definition: {
        handle: "rawReadApi",
        usage: "rawReadApi[url]",
        description: '(Deprecated: use $readApi) Calls the given URL and returns the response as an object.',
        examples: [
            {
                usage: 'rawReadApi[url, object.path.here]',
                description: "Traverse a JSON response object."
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["text", "number"],
        hidden: true
    },
    evaluator: (
        trigger: Trigger,
        ...args: unknown[]
    ) : unknown => {
        return readApi.evaluator(trigger, ...args);
    }
};

export default model;