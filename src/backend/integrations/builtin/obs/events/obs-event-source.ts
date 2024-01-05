import { EventSource } from "../../../../../types/events";
import {
    OBS_CURRENT_PROFILE_CHANGED_EVENT_ID,
    OBS_CURRENT_PROGRAM_SCENE_CHANGED_EVENT_ID,
    OBS_CURRENT_SCENE_COLLECTION_CHANGED_EVENT_ID,
    OBS_CURRENT_SCENE_TRANSITION_CHANGED_EVENT_ID,
    OBS_CURRENT_SCENE_TRANSITION_DURATION_CHANGED_EVENT_ID,
    OBS_EVENT_SOURCE_ID,
    OBS_RECORDING_STARTED_EVENT_ID,
    OBS_RECORDING_STOPPED_EVENT_ID,
    OBS_REPLAY_BUFFER_SAVED_EVENT_ID,
    OBS_SCENE_CHANGED_EVENT_ID,
    OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID,
    OBS_SCENE_TRANSITION_ENDED_EVENT_ID,
    OBS_SCENE_TRANSITION_STARTED_EVENT_ID,
    OBS_STREAM_STARTED_EVENT_ID,
    OBS_STREAM_STOPPED_EVENT_ID,
    OBS_VENDOR_EVENT_EVENT_ID
} from "../constants";

export const OBSEventSource: EventSource = {
    id: OBS_EVENT_SOURCE_ID,
    name: "OBS",
    events: [
        {
            id: OBS_SCENE_CHANGED_EVENT_ID,
            name: "OBS Scene Changed",
            description: "When the scene is changed in OBS",
            manualMetadata: {
                sceneName: "Test Scene Name"
            }
        },
        {
            id: OBS_STREAM_STARTED_EVENT_ID,
            name: "OBS Stream Started",
            description: "When the stream has successfully started in OBS",
            manualMetadata: {}
        },
        {
            id: OBS_STREAM_STOPPED_EVENT_ID,
            name: "OBS Stream Stopped",
            description: "When the stream has stopped in OBS",
            manualMetadata: {}
        },
        {
            id: OBS_RECORDING_STARTED_EVENT_ID,
            name: "OBS Recording Started",
            description: "When recording has successfully started in OBS",
            manualMetadata: {}
        },
        {
            id: OBS_RECORDING_STOPPED_EVENT_ID,
            name: "OBS Recording Stopped",
            description: "When recording has stopped in OBS",
            manualMetadata: {}
        },
        {
            id: OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID,
            name: "OBS Scene Item Enable State Changed",
            description: "When an item in a scene is enabled/disabled",
            manualMetadata: {}
        },
        {
            id: OBS_SCENE_TRANSITION_STARTED_EVENT_ID,
            name: "OBS Scene Transition Started",
            description: "When a scene transition in OBS has started",
            manualMetadata: {
                transitionName: "Test Transition"
            }
        },
        {
            id: OBS_SCENE_TRANSITION_ENDED_EVENT_ID,
            name: "OBS Scene Transition Ended",
            description: "When a scene transition in OBS has ended",
            manualMetadata: {
                transitionName: "Test Transition"
            }
        },
        {
            id: OBS_CURRENT_PROGRAM_SCENE_CHANGED_EVENT_ID,
            name: "OBS Current Program Scene Changed",
            description: "When the current program scene has changed in OBS",
            manualMetadata: {
                sceneName: "New Scene"
            }
        },
        {
            id: OBS_CURRENT_SCENE_TRANSITION_CHANGED_EVENT_ID,
            name: "OBS Current Scene Transition Changed",
            description: "When the current scene transition in OBS has changed",
            manualMetadata: {
                transitionName: "Test Transition"
            }
        },
        {
            id: OBS_CURRENT_SCENE_TRANSITION_DURATION_CHANGED_EVENT_ID,
            name: "OBS Current Scene Transition Duration Changed",
            description: "When the current scene transition duration in OBS has changed",
            manualMetadata: {
                transitionDuration: 1000
            }
        },
        {
            id: OBS_REPLAY_BUFFER_SAVED_EVENT_ID,
            name: "OBS Replay Buffer Saved",
            description: "When OBS saves the replay buffer",
            manualMetadata: {}
        },
        {
            id: OBS_CURRENT_SCENE_COLLECTION_CHANGED_EVENT_ID,
            name: "OBS Current Scene Collection Changed",
            description: "When the current scene collection is changed in OBS",
            manualMetadata: {
                sceneCollectionName: "New Scene Collection"
            }
        },
        {
            id: OBS_CURRENT_PROFILE_CHANGED_EVENT_ID,
            name: "OBS Current Profile Changed",
            description: "When the current profile is changed in OBS",
            manualMetadata: {
                profileName: "Test Profile"
            }
        },
        {
            id: OBS_VENDOR_EVENT_EVENT_ID,
            name: "OBS Vendor Event",
            description: "When a third-party plugin or script emits an event in OBS",
            manualMetadata: {
                vendorName: "Test Vendor",
                eventType: "Test Event Type"
            }
        }
    ]
};