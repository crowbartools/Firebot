import { EventSource } from "../../../../../types/events";
import {
  OBS_EVENT_SOURCE_ID,
  OBS_SCENE_CHANGED_EVENT_ID,
  OBS_STREAM_STARTED_EVENT_ID,
  OBS_STREAM_STOPPED_EVENT_ID,
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
        sceneName: "Test Scene Name",
      },
    },
    {
      id: OBS_STREAM_STARTED_EVENT_ID,
      name: "OBS Stream Started",
      description: "When the stream has successfully started in OBS",
      manualMetadata: {},
    },
    {
      id: OBS_STREAM_STOPPED_EVENT_ID,
      name: "OBS Stream Stopped",
      description: "When the stream has stopped in OBS",
      manualMetadata: {},
    },
  ],
};
