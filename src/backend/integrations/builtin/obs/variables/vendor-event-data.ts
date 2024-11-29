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

export const VendorEventDataVariable: ReplaceVariable = {
    definition: {
        handle: "obsVendorEventData",
        description:
      "The vendor-specified raw JSON data from the OBS vendor event.",
        possibleDataOutput: ["text"],
        categories: [VariableCategory.ADVANCED, VariableCategory.INTEGRATION, VariableCategory.OBS],
        triggers: triggers
    },
    evaluator: async (trigger) => {
        const eventData = trigger.metadata?.eventData?.eventData;
        return JSON.stringify(eventData ?? {});
    }
};
