import type { ReplaceVariable } from "../../../../types/variables";

export const webhookHeader: ReplaceVariable = {
    definition: {
        handle: "webhookHeader",
        usage: "webhookHeader[key]",
        description: "The value of a specific header included with the webhook request.",
        possibleDataOutput: ["text"],
        triggers: {
            ["event"]: ["firebot:webhook-received"],
            ["manual"]: true
        }
    },
    evaluator(trigger, key: string) {
        const headers = (trigger?.metadata?.eventData?.webhookHeaders ?? {}) as Record<string, string>;
        return headers[key] ?? "";
    }
};

export default webhookHeader;