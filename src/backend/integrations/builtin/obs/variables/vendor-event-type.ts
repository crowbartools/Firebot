import { ReplaceVariable, TriggersObject } from "../../../../../types/variables";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_VENDOR_EVENT_EVENT_ID
} from "../constants";

const triggers: TriggersObject = {};
triggers["event"] = [
    `${OBS_EVENT_SOURCE_ID}:${OBS_VENDOR_EVENT_EVENT_ID}`
];

export const VendorEventTypeVariable: ReplaceVariable = {
    definition: {
        handle: "obsVendorEventType",
        description:
      "The vendor-specified type of event that triggered the OBS vendor event.",
        possibleDataOutput: ["text"],
        categories: ["advanced", "integrations", "obs"],
        triggers: triggers
    },
    evaluator: (trigger) => {
        const eventType = trigger.metadata?.eventData?.eventType;
        return eventType ?? "Unknown";
    }
};