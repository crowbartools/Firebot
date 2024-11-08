import { createPresetFilter } from "../../../../events/filters/filter-factory";
import { EventFilter } from "../../../../../types/events";
import {
    OBS_EVENT_SOURCE_ID,
    OBS_SCENE_CHANGED_EVENT_ID,
    OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID
} from "../constants";

const filter: EventFilter = createPresetFilter({
    id: "ebiggz:obs-scene-name",
    name: "Scene Name",
    description: "Filter on the name of the now active OBS scene",
    events: [
        { eventSourceId: OBS_EVENT_SOURCE_ID, eventId: OBS_SCENE_CHANGED_EVENT_ID },
        { eventSourceId: OBS_EVENT_SOURCE_ID, eventId: OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID }
    ],
    eventMetaKey: "sceneName",
    allowIsNot: true,
    presetValues: async (backendCommunicator: any) => {
        const scenes: string[] = await backendCommunicator.fireEventAsync("obs-get-scene-list");
        return scenes.map((s) => {
            return {
                value: s,
                display: s
            };
        });
    }
});

export default filter;
