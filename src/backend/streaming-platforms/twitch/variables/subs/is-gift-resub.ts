import type { ReplaceVariable } from "../../../../../types/variables";

const model: ReplaceVariable = {
    definition: {
        handle: "isGiftResub",
        description: "Whether or not the resub was the result of a gift.",
        categories: ["trigger based", "user based"],
        possibleDataOutput: ["bool"],
        triggers: {
            event: [
                "twitch:sub"
            ],
            manual: true
        }
    },
    evaluator: (trigger) => {
        return trigger.metadata?.eventData?.isGiftResub === true;
    }
};

export default model;
