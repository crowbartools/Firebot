import { TriggerType } from "../../../../common/EffectType";
import { ReplaceVariable } from "../../../../../types/variables";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_VENDOR_EVENT_EVENT_ID
} from "../constants";

const triggers = {};
triggers[TriggerType.EVENT] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_VENDOR_EVENT_EVENT_ID}`
];
import { VariableCategory } from "../../../../../shared/variable-constants";

export const VendorEventTypeVariable: ReplaceVariable = {
    definition: {
        handle: "obsVendorEventType",
        description:
      "The vendor-specified type of event that triggered the OBS vendor event.",
        possibleDataOutput: ["text"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS],
        triggers: triggers
    },
    evaluator: async (trigger) => {
        const eventType = trigger.metadata?.eventData?.eventType;
        return eventType ?? "Unknown";
    }
};
