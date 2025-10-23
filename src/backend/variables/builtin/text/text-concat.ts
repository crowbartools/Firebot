import type { ReplaceVariable, Trigger } from "../../../../types/variables";
import { stringify } from '../../../utils';

const model : ReplaceVariable = {
    definition: {
        handle: "concat",
        description: "Appends text together",
        usage: "concat[text, text, ...]",
        examples: [
            {
                usage: `concat[Hello, " ", World]`,
                description: `Returns "Hello World"`
            }
        ],
        categories: ["text"],
        possibleDataOutput: ["text"]
    },
    evaluator: (
        trigger: Trigger,
        ...args: unknown[]
    ) : string => {
        return args.map(stringify).join('');
    }
};

export default model;