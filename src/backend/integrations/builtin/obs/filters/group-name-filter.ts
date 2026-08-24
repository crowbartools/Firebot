import type { EventFilter, BackendCommunicator } from "../../../../../types";
import { createPresetFilter } from "../../../../events/filters/filter-factory";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID
} from "../constants";

const filter: EventFilter = createPresetFilter({
    id: "ebiggz:obs-group-name",
    name: "Group Name",
    description: "Filter on the name of the group owning the item that triggered the event",
    events: [
        { eventSourceId: OBS_EVENT_SOURCE_ID, eventId: OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID }
    ],
    eventMetaKey: "groupName",
    allowIsNot: true,
    presetValues: async (backendCommunicator: BackendCommunicator) => {
        const groups: string[] = await backendCommunicator.fireEventAsync("obs-get-group-list");
        return groups.map((g) => {
            return {
                value: g,
                display: g
            };
        });
    }
});

export default filter;
