import { EffectTrigger } from "../../../../shared/effect-constants";
import { ReplaceVariable } from "../../../../types/variables";

export const webhookHeader: ReplaceVariable = {
    definition: {
        handle: "webhookHeader",
        usage: "webhookHeader[key]",
        description: "The value of a specific header included with the webhook request.",
        possibleDataOutput: ["text"],
        triggers: {
            [EffectTrigger.EVENT]: ["firebot:webhook-received"],
            [EffectTrigger.MANUAL]: true
        }
    },
    evaluator(trigger, key: string) {
        const headers = trigger?.metadata?.eventData?.webhookHeaders ?? {};
        return (
            headers[key] ?? ""
        );
    }
};

export default webhookHeader;