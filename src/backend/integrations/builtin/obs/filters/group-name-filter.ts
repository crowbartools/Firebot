import { EventFilter } from "../../../../../types/events";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID
} from "../constants";

export const GroupNameEventFilter: EventFilter = {
    id: "ebiggz:obs-group-name",
    name: "Group Name",
    events: [
        { eventSourceId: OBS_EVENT_SOURCE_ID, eventId: OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID }
    ],
    description: "Filter on the name of the group owning the item that triggered the event",
    valueType: "preset",
    comparisonTypes: ["is", "is not"],
    presetValues: (backendCommunicator, $q) => {
        return $q
            .when(backendCommunicator.fireEvents("obs-get-group-list"))
            .then((groups: string[]) =>
                groups.map((g) => {
                    return {
                        value: g,
                        display: g
                    };
                })
            );
    },
    predicate: async ({ comparisonType, value }, { eventMeta }) => {
        const expected = value;
        const actual = eventMeta.groupName;

        switch (comparisonType) {
            case "is":
                return actual === expected;
            case "is not":
                return actual !== expected;
            default:
                return false;
        }
    }
};
