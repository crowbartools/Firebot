import { EventSource } from "../../../../../types/events";
import {
    OBS_CURRENT_PROFILE_CHANGED_EVENT_ID,
    OBS_CURRENT_PROGRAM_SCENE_CHANGED_EVENT_ID,
    OBS_CURRENT_SCENE_COLLECTION_CHANGED_EVENT_ID,
    OBS_CURRENT_SCENE_TRANSITION_CHANGED_EVENT_ID,
    OBS_CURRENT_SCENE_TRANSITION_DURATION_CHANGED_EVENT_ID,
    OBS_EVENT_SOURCE_ID,
    OBS_CONNECTED_EVENT_ID,
    OBS_DISCONNECTED_EVENT_ID,
    OBS_RECORDING_STARTED_EVENT_ID,
    OBS_RECORDING_STOPPED_EVENT_ID,
    OBS_REPLAY_BUFFER_SAVED_EVENT_ID,
    OBS_SCENE_CHANGED_EVENT_ID,
    OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID,
    OBS_SCENE_TRANSITION_ENDED_EVENT_ID,
    OBS_SCENE_TRANSITION_STARTED_EVENT_ID,
    OBS_STREAM_STARTED_EVENT_ID,
    OBS_STREAM_STOPPED_EVENT_ID,
    OBS_VENDOR_EVENT_EVENT_ID,
    OBS_INPUT_CREATED_EVENT_ID,
    OBS_INPUT_REMOVED_EVENT_ID,
    OBS_INPUT_NAME_CHANGED_EVENT_ID,
    OBS_INPUT_SETTINGS_CHANGED_EVENT_ID,
    OBS_INPUT_ACTIVE_STATE_CHANGED_EVENT_ID,
    OBS_INPUT_SHOW_STATE_CHANGED_EVENT_ID,
    OBS_INPUT_MUTE_STATE_CHANGED_EVENT_ID,
    OBS_INPUT_VOLUME_CHANGED_EVENT_ID,
    OBS_INPUT_AUDIO_BALANCE_CHANGED_EVENT_ID,
    OBS_INPUT_AUDIO_SYNC_OFFSET_CHANGED_EVENT_ID,
    OBS_INPUT_AUDIO_MONITOR_TYPE_CHANGED_EVENT_ID,
    OBS_INPUT_AUDIO_TRACKS_CHANGED_EVENT_ID
} from "../constants";

export const OBSEventSource: EventSource = {
    id: OBS_EVENT_SOURCE_ID,
    name: "OBS",
    events: [
        {
            id: OBS_CONNECTED_EVENT_ID,
            name: "OBS Connected",
            description: "When OBS websocket is connected",
            manualMetadata: {}
        },
        {
            id: OBS_DISCONNECTED_EVENT_ID,
            name: "OBS Disconnected",
            description: "When OBS websocket is disconnected",
            manualMetadata: {}
        },
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
            manualMetadata: {
                groupItemId: -1,
                groupName: "Test Group Name",
                sceneItemEnabled: true,
                sceneItemId: -1,
                sceneName: "Test Scene Name"
            }
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
        },
        {
            id: OBS_INPUT_CREATED_EVENT_ID,
            name: "OBS Input Created",
            description: "When an input has been created in OBS",
            manualMetadata: {
                inputName: "Microphone",
                inputUuid: "",
                inputKind: ""
            }
        },
        {
            id: OBS_INPUT_REMOVED_EVENT_ID,
            name: "OBS Input Removed",
            description: "When an input has been removed in OBS",
            manualMetadata: {
                inputName: "Microphone",
                inputUuid: ""
            }
        },
        {
            id: OBS_INPUT_NAME_CHANGED_EVENT_ID,
            name: "OBS Input Name Changed",
            description: "When the name of an input has changed in OBS",
            manualMetadata: {
                oldInputName: "",
                inputName: "Microphone",
                inputUuid: ""
            }
        },
        {
            id: OBS_INPUT_SETTINGS_CHANGED_EVENT_ID,
            name: "OBS Input Settings Changed",
            description: "When an input's settings have changed/updated in OBS",
            manualMetadata: {
                inputName: "Microphone",
                inputUuid: ""
            }
        },
        {
            id: OBS_INPUT_ACTIVE_STATE_CHANGED_EVENT_ID,
            name: "OBS Input Active State Changed",
            description: "When an input's active state has changed in OBS",
            manualMetadata: {
                inputName: "Microphone",
                inputUuid: "",
                inputActive: true
            }
        },
        {
            id: OBS_INPUT_SHOW_STATE_CHANGED_EVENT_ID,
            name: "OBS Input Show State Changed",
            description: "When an input's show state has changed in OBS",
            manualMetadata: {
                inputName: "Microphone",
                inputUuid: "",
                inputShowing: true
            }
        },
        {
            id: OBS_INPUT_MUTE_STATE_CHANGED_EVENT_ID,
            name: "OBS Input Mute State Changed",
            description: "When an input's mute state has changed in OBS",
            manualMetadata: {
                inputName: "Microphone",
                inputUuid: "",
                inputMuted: true
            }
        },
        {
            id: OBS_INPUT_VOLUME_CHANGED_EVENT_ID,
            name: "OBS Input Volume Level Changed",
            description: "When an input's volume level has changed in OBS",
            manualMetadata: {
                inputName: "Microphone",
                inputUuid: "",
                inputVolumeMultiplier: 0,
                inputVolumeDb: 0
            }
        },
        {
            id: OBS_INPUT_AUDIO_BALANCE_CHANGED_EVENT_ID,
            name: "OBS Input Audio Balance Changed",
            description: "When an input's audio balance has changed in OBS",
            manualMetadata: {
                inputName: "Microphone",
                inputUuid: "",
                inputAudioBalance: 0
            }
        },
        {
            id: OBS_INPUT_AUDIO_SYNC_OFFSET_CHANGED_EVENT_ID,
            name: "OBS Input Audio Sync Offset Changed",
            description: "When an input's audio sync offset has changed in OBS",
            manualMetadata: {
                inputName: "Microphone",
                inputUuid: "",
                inputAudioSyncOffset: 0
            }
        },
        {
            id: OBS_INPUT_AUDIO_TRACKS_CHANGED_EVENT_ID,
            name: "OBS Input Audio Tracks Changed",
            description: "When an input's audio tracks have changed in OBS",
            manualMetadata: {
                inputName: "Microphone",
                inputUuid: ""
            }
        },
        {
            id: OBS_INPUT_AUDIO_MONITOR_TYPE_CHANGED_EVENT_ID,
            name: "OBS Input Audio Monitor Type Changed",
            description: "When an input's audio monitor type has changed in OBS",
            manualMetadata: {
                inputName: "Microphone",
                inputUuid: "",
                monitorType: {
                    type: "enum",
                    options: {
                        "OBS_MONITORING_TYPE_NONE": "None",
                        "OBS_MONITORING_TYPE_MONITOR_ONLY": "Monitor Only",
                        "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT": "Monitor and Output"
                    },
                    value: "OBS_MONITORING_TYPE_NONE"
                }
            }
        }
    ]
};