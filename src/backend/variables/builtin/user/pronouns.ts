import type { ReplaceVariable } from "../../../../types";
import { FirebotPronounManager } from "../../../pronouns/pronoun-manager";
import { LoggerCache } from "../../../logger-cache";

const logger = LoggerCache.getLogger("Variables");

const model : ReplaceVariable = {
    definition: {
        handle: "pronouns",
        description: "Returns the pronouns of the given user. It uses https://pr.alejo.io/ to get the pronouns.",
        examples: [
            {
                usage: 'pronouns[username, 0, they/them]',
                description: "Returns 'she/her' if available, otherwise uses they/them."
            },
            {
                usage: 'pronouns[username, 1, they]',
                description: "Returns 'she' pronoun in she/her set if available, otherwise uses they."
            },
            {
                usage: 'pronouns[username, 2, them]',
                description: "Returns 'her' pronoun in she/her set if available, otherwise uses them."
            }
        ],
        categories: ["common"],
        possibleDataOutput: ["text"]
    },
    evaluator: async (
        trigger,
        username: string,
        pronounNumber: number | string = 0,
        fallback : string = "they/them"
    ) => {
        if (!username?.length) {
            username = trigger.metadata.username;
        }

        if (typeof pronounNumber === 'string' || <unknown>pronounNumber instanceof String) {
            pronounNumber = Number(`${pronounNumber}`);
        }

        if (!Number.isFinite(pronounNumber)) {
            logger.warn(`Pronoun index not a number. Using "${fallback}"`);
            return fallback;
        }

        const fallbackParts = (fallback ?? "").split("/");
        let fallbackPart = fallback;
        let type: "subject" | "object" | "both";

        switch (pronounNumber) {
            case 1:
                type = "subject";
                fallbackPart = fallbackParts[0];
                break;

            case 2:
                type = "object";
                fallbackPart = fallbackParts[1] ?? fallbackParts[0];
                break;

            default:
                type = "both";
                break;
        }

        const pronoun = await FirebotPronounManager.getUserFriendlyPronounString(username, fallback, type);

        return !!pronoun?.length
            ? pronoun
            : fallbackPart;
    }
};
export default model;