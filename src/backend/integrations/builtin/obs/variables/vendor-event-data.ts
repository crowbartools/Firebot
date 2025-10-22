import { ReplaceVariable, TriggersObject } from "../../../../../types/variables";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_VENDOR_EVENT_EVENT_ID
} from "../constants";

const triggers: TriggersObject = {};
triggers["event"] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_VENDOR_EVENT_EVENT_ID}`
];

export const VendorEventDataVariable: ReplaceVariable = {
    definition: {
        handle: "obsVendorEventData",
        description:
      "The vendor-specified raw JSON data from the OBS vendor event.",
        possibleDataOutput: ["text"],
        categories: ["advanced", "integrations", "obs"],
        triggers: triggers
    },
    evaluator: (trigger) => {
        const eventData = trigger.metadata?.eventData?.eventData;
        return JSON.stringify(eventData ?? {});
    }
};