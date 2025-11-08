import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:subs-gifted", "twitch:community-subs-gifted", "twitch:gift-sub-upgraded"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "giftSubType",
        description: "The type of gifted subs (ie Tier 1, 2, 3).",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        switch (trigger.metadata.eventData.subPlan) {
            case "Prime":
                return "Prime";
            case "1000":
                return "Tier 1";
            case "2000":
                return "Tier 2";
            case "3000":
                return "Tier 3";
        }

        return "";
    }
};

export default model;
