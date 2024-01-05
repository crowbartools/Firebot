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

export const VendorEventDataVariable: ReplaceVariable = {
    definition: {
        handle: "obsVendorEventData",
        description:
      "The vendor-specified raw JSON data from the OBS vendor event.",
        possibleDataOutput: ["text"],
        triggers: triggers
    },
    evaluator: async (trigger) => {
        const eventData = trigger.metadata?.eventData?.eventData;
        return JSON.stringify(eventData ?? {});
    }
};
