import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:community-subs-gifted"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "rawGiftReceivers",
        description: "Returns a raw array containing the recipients' usernames and months subbed",
        triggers: triggers,
        categories: ["common", "user based", "trigger based"],
        possibleDataOutput: ["array", "text"]
    },
    evaluator: (trigger) => {
        if (trigger == null || trigger.metadata == null || trigger.metadata.eventData == null || trigger.metadata.eventData.giftReceivers == null) {
            return "Failed to get gift receiver info";
        }

        return (trigger.metadata.eventData.giftReceivers as any).map(gr => ({
            username: gr.gifteeUsername,
            months: gr.giftSubMonths ?? 1
        }));
    }
};

export default model;
