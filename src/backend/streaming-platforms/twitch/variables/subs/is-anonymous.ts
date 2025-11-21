import type { ReplaceVariable } from "../../../../../types/variables";

const model: ReplaceVariable = {
    definition: {
        handle: "isAnonymous",
        description: "Whether or not the gift sub(s) were given anonymously.",
        categories: ["trigger based", "user based"],
        possibleDataOutput: ["bool"],
        triggers: {
            event: [
                "twitch:community-subs-gifted",
                "twitch:subs-gifted"
            ],
            manual: true
        }
    },
    evaluator: (trigger) => {
        return trigger.metadata?.eventData?.isAnonymous === true;
    }
};

export default model;
