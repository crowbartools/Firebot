import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:community-subs-gifted"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "giftReceivers",
        description: "A comma separated list of the usernames of the receivers of a community gift sub.",
        examples: [
            {
                usage: "giftReceivers[1, username]",
                description: "Displays the username of a specific gift receiver in the list."
            },
            {
                usage: "giftReceivers[3, months]",
                description: "(Deprecated: removed from Twitch data) Displays the cumulative sub months of a specific gift receiver in the list."
            }
        ],
        triggers: triggers,
        categories: ["common", "user based", "trigger based"],
        possibleDataOutput: ["ALL"]
    },
    evaluator: (trigger, target: null | number = null, property) => {
        if (trigger == null || trigger.metadata == null || trigger.metadata.eventData == null || trigger.metadata.eventData.giftReceivers == null) {
            return "Failed to get gift receiver info";
        }

        const giftReceiverNames = (trigger.metadata.eventData.giftReceivers as any).map(gr => gr.gifteeUsername);
        const giftReceiverMonths = (trigger.metadata.eventData.giftReceivers as any).map(gr => gr.giftSubMonths ?? 1);

        if (target == null && property == null) {
            return giftReceiverNames.join(", ");
        }

        if (target != null && property === "username") {
            return `${giftReceiverNames[target]}`;
        }

        if (target != null && property === "months") {
            return `${giftReceiverMonths[target]}`;
        }

        if (isNaN(target) && property != null) {
            return "The first argument needs to be a number";
        }

        if (target != null && property == null) {
            return "Invalid number of arguments";
        }

        if (target != null && property != null) {
            return "The second argument needs to be either 'username' or 'months'";
        }

        return "Invalid use of variable";
    }
};

export default model;