import { ScriptModules } from "@crowbartools/firebot-custom-scripts-types";
import {
  getAllSources,
  getSceneList,
  getSceneCollectionList,
  getSourceData,
  SourceData,
  OBSSource,
  getSourcesWithFilters,
  getAudioSources,
  getTextSources,
} from "./obs-remote";

export function setupFrontendListeners(
  frontendCommunicator: ScriptModules["frontendCommunicator"]
) {
  frontendCommunicator.onAsync<never, string[]>(
    "obs-get-scene-list",
    getSceneList
  );

  frontendCommunicator.onAsync<never, string[]>(
    "obs-get-scene-collection-list",
    getSceneCollectionList
  );

  frontendCommunicator.onAsync<never, SourceData>(
    "obs-get-source-data",
    getSourceData
  );

  frontendCommunicator.onAsync<never, Array<OBSSource>>(
    "obs-get-sources-with-filters",
    getSourcesWithFilters
  );

  frontendCommunicator.onAsync<never, Array<OBSSource>>(
    "obs-get-audio-sources",
    getAudioSources
  );

  frontendCommunicator.onAsync<never, Array<OBSSource>>(
    "obs-get-text-sources",
    getTextSources
  );
}
