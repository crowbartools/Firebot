import { ScriptModules } from "@crowbartools/firebot-custom-scripts-types";
import OBSWebSocket from "obs-websocket-js";
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
    OBS_INPUT_AUDIO_TRACKS_CHANGED_EVENT_ID,
    OBS_CONNECTED_EVENT_ID,
    OBS_DISCONNECTED_EVENT_ID
} from "./constants";
import logger from "../../../logwrapper";

let eventManager: ScriptModules["eventManager"];

const obs = new OBSWebSocket();

let connected = false;

const TEXT_SOURCE_IDS = ["text_gdiplus_v2", "text_gdiplus_v3", "text_ft2_source_v2"];

function setupRemoteListeners() {
    obs.on("CurrentProgramSceneChanged", ({ sceneName }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_SCENE_CHANGED_EVENT_ID,
            {
                sceneName
            }
        );
    });

    obs.on("StreamStateChanged", ({ outputState }) => {
        switch (outputState) {
            case "OBS_WEBSOCKET_OUTPUT_STARTED":
                eventManager?.triggerEvent(
                    OBS_EVENT_SOURCE_ID,
                    OBS_STREAM_STARTED_EVENT_ID,
                    {}
                );
                break;

            case "OBS_WEBSOCKET_OUTPUT_STOPPED":
                eventManager?.triggerEvent(
                    OBS_EVENT_SOURCE_ID,
                    OBS_STREAM_STOPPED_EVENT_ID,
                    {}
                );
                break;
        }
    });

    obs.on("RecordStateChanged", ({ outputState }) => {
        switch (outputState) {
            case "OBS_WEBSOCKET_OUTPUT_STARTED":
                eventManager?.triggerEvent(
                    OBS_EVENT_SOURCE_ID,
                    OBS_RECORDING_STARTED_EVENT_ID,
                    {}
                );
                break;

            case "OBS_WEBSOCKET_OUTPUT_STOPPED":
                eventManager?.triggerEvent(
                    OBS_EVENT_SOURCE_ID,
                    OBS_RECORDING_STOPPED_EVENT_ID,
                    {}
                );
                break;
        }
    });

    obs.on("SceneItemEnableStateChanged", ({ sceneName, sceneItemId, sceneItemEnabled }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_SCENE_ITEM_ENABLE_STATE_CHANGED_EVENT_ID,
            {
                sceneName,
                sceneItemId,
                sceneItemEnabled
            }
        );
    });

    obs.on("SceneTransitionStarted", ({ transitionName }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_SCENE_TRANSITION_STARTED_EVENT_ID,
            {
                transitionName
            }
        );
    });

    obs.on("SceneTransitionEnded", ({ transitionName }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_SCENE_TRANSITION_ENDED_EVENT_ID,
            {
                transitionName
            }
        );
    });

    obs.on("CurrentProgramSceneChanged", ({ sceneName }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_CURRENT_PROGRAM_SCENE_CHANGED_EVENT_ID,
            {
                sceneName
            }
        );
    });

    obs.on("CurrentSceneTransitionChanged", ({ transitionName }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_CURRENT_SCENE_TRANSITION_CHANGED_EVENT_ID,
            {
                transitionName
            }
        );
    });

    obs.on("CurrentSceneTransitionDurationChanged", ({ transitionDuration }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_CURRENT_SCENE_TRANSITION_DURATION_CHANGED_EVENT_ID,
            {
                transitionDuration
            }
        );
    });

    obs.on("ReplayBufferSaved", ({ savedReplayPath }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_REPLAY_BUFFER_SAVED_EVENT_ID,
            {
                savedReplayPath
            }
        );
    });

    obs.on("CurrentSceneCollectionChanged", ({ sceneCollectionName }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_CURRENT_SCENE_COLLECTION_CHANGED_EVENT_ID,
            {
                sceneCollectionName
            }
        );
    });

    obs.on("CurrentProfileChanged", ({ profileName }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_CURRENT_PROFILE_CHANGED_EVENT_ID,
            {
                profileName
            }
        );
    });

    obs.on("VendorEvent", ({ vendorName, eventType, eventData }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_VENDOR_EVENT_EVENT_ID,
            {
                vendorName,
                eventType,
                eventData
            }
        );
    });

    obs.on("InputCreated", ({ inputName, inputUuid, inputKind, inputSettings }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_INPUT_CREATED_EVENT_ID,
            {
                inputName,
                inputUuid,
                inputKind,
                inputSettings
            }
        );
    });

    obs.on("InputRemoved", ({ inputName, inputUuid }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_INPUT_REMOVED_EVENT_ID,
            {
                inputName,
                inputUuid
            }
        );
    });

    obs.on("InputNameChanged", ({ oldInputName, inputName, inputUuid }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_INPUT_NAME_CHANGED_EVENT_ID,
            {
                oldInputName,
                inputName,
                inputUuid
            }
        );
    });

    obs.on("InputSettingsChanged", ({ inputName, inputUuid, inputSettings }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_INPUT_SETTINGS_CHANGED_EVENT_ID,
            {
                inputName,
                inputUuid,
                inputSettings
            }
        );
    });

    obs.on("InputActiveStateChanged", ({ inputName, inputUuid, videoActive }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_INPUT_ACTIVE_STATE_CHANGED_EVENT_ID,
            {
                inputName,
                inputUuid,
                inputActive: videoActive
            }
        );
    });

    obs.on("InputShowStateChanged", ({ inputName, inputUuid, videoShowing }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_INPUT_SHOW_STATE_CHANGED_EVENT_ID,
            {
                inputName,
                inputUuid,
                inputShowing: videoShowing
            }
        );
    });

    obs.on("InputMuteStateChanged", ({ inputName, inputUuid, inputMuted }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_INPUT_MUTE_STATE_CHANGED_EVENT_ID,
            {
                inputName,
                inputUuid,
                inputMuted
            }
        );
    });

    obs.on("InputVolumeChanged", ({ inputName, inputUuid, inputVolumeMul, inputVolumeDb }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_INPUT_VOLUME_CHANGED_EVENT_ID,
            {
                inputName,
                inputUuid,
                inputVolumeMultiplier: inputVolumeMul,
                inputVolumeDb
            }
        );
    });

    obs.on("InputAudioBalanceChanged", ({ inputName, inputUuid, inputAudioBalance }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_INPUT_AUDIO_BALANCE_CHANGED_EVENT_ID,
            {
                inputName,
                inputUuid,
                inputAudioBalance
            }
        );
    });

    obs.on("InputAudioSyncOffsetChanged", ({ inputName, inputUuid, inputAudioSyncOffset }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_INPUT_AUDIO_SYNC_OFFSET_CHANGED_EVENT_ID,
            {
                inputName,
                inputUuid,
                inputAudioSyncOffset
            }
        );
    });

    obs.on("InputAudioTracksChanged", ({ inputName, inputUuid, inputAudioTracks }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_INPUT_AUDIO_TRACKS_CHANGED_EVENT_ID,
            {
                inputName,
                inputUuid,
                inputAudioTracks
            }
        );
    });

    obs.on("InputAudioMonitorTypeChanged", ({ inputName, inputUuid, monitorType }) => {
        eventManager?.triggerEvent(
            OBS_EVENT_SOURCE_ID,
            OBS_INPUT_AUDIO_MONITOR_TYPE_CHANGED_EVENT_ID,
            {
                inputName,
                inputUuid,
                monitorType
            }
        );
    });
}

let reconnectTimeout: NodeJS.Timeout | null = null;
let isForceClosing = false;
async function maintainConnection(
    ip: string,
    port: number,
    password: string,
    logging: boolean,
    forceClose = false
) {
    if (forceClose && connected) {
        isForceClosing = true;
        await obs.disconnect();
        connected = false;
        isForceClosing = false;
    }
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    if (!connected) {
        try {
            if (logging) {
                logger.debug("Trying to connect to OBS...");
            }

            obs.removeAllListeners();

            await obs.connect(`ws://${ip}:${port}`, password);

            logger.info("Successfully connected to OBS.");

            connected = true;
            eventManager?.triggerEvent(OBS_EVENT_SOURCE_ID, OBS_CONNECTED_EVENT_ID, {});

            setupRemoteListeners();

            obs.on("ConnectionClosed", () => {
                if (!connected) {
                    return;
                }

                connected = false;
                eventManager?.triggerEvent(OBS_EVENT_SOURCE_ID, OBS_DISCONNECTED_EVENT_ID, {});

                if (isForceClosing) {
                    return;
                }
                try {
                    logger.info("Connection lost, attempting again in 10 secs.");
                    reconnectTimeout = setTimeout(
                        () => maintainConnection(ip, port, password, logging),
                        10000
                    );
                } catch (err) {
                    // silently fail
                }
            });
        } catch (error) {
            if (logging) {
                logger.debug("Failed to connect, attempting again in 10 secs.");
                logger.debug(error);
            }
            reconnectTimeout = setTimeout(
                () => maintainConnection(ip, port, password, logging),
                10000
            );
        }
    }
}

export function initRemote(
    {
        ip,
        port,
        password,
        logging,
        forceConnect
    }: {
        ip: string;
        port: number;
        password: string;
        logging: boolean;
        forceConnect?: boolean;
    },
    modules: {
        eventManager: ScriptModules["eventManager"];
    }
) {
    eventManager = modules.eventManager;
    maintainConnection(ip, port, password, logging, forceConnect);
}
export async function getSceneList(): Promise<string[]> {
    if (!connected) {
        return [];
    }
    try {
        const sceneData = await obs.call("GetSceneList");
        return sceneData.scenes.map(s => s.sceneName as string);
    } catch (error) {
        return [];
    }
}

export async function getCurrentSceneName(): Promise<string> {
    if (!connected) {
        return null;
    }
    try {
        const scene = await obs.call("GetCurrentProgramScene");
        return scene?.currentProgramSceneName;
    } catch (error) {
        return null;
    }
}

export async function setCurrentScene(sceneName: string): Promise<void> {
    if (!connected) {
        return;
    }
    try {
        await obs.call("SetCurrentProgramScene", {
            sceneName
        });
    } catch (error) {
        logger.error("Failed to set current scene", error);
    }
}

export async function getSceneCollectionList(): Promise<string[]> {
    if (!connected) {
        return [];
    }
    try {
        const sceneCollectionData = await obs.call("GetSceneCollectionList");
        return sceneCollectionData.sceneCollections;
    } catch (error) {
        return [];
    }
}

export async function getCurrentSceneCollectionName(): Promise<string> {
    if (!connected) {
        return null;
    }
    try {
        const response = await obs.call("GetSceneCollectionList");
        return response?.currentSceneCollectionName;
    } catch (error) {
        return null;
    }
}

export async function setCurrentSceneCollection(
    sceneCollectionName: string
): Promise<void> {
    if (!connected) {
        return;
    }
    try {
        await obs.call("SetCurrentSceneCollection", {
            sceneCollectionName
        });
    } catch (error) {
        logger.error("Failed to set current scene collection", error);
    }
}

export type SourceData = Record<string, Array<{ id: number; name: string, groupName?: string }>>;

export async function getSourceData(): Promise<SourceData> {
    if (!connected) {
        return null;
    }
    try {
        const sceneData = await obs.call("GetSceneList");
        const data: SourceData = {};
        for (const scene of sceneData.scenes) {
            const itemList = await obs.call("GetSceneItemList", {
                sceneName: scene.sceneName as string
            });

            data[scene.sceneName as string] = [];

            for (const item of itemList.sceneItems) {
                data[scene.sceneName as string].push({
                    id: item.sceneItemId as number,
                    name: item.sourceName as string
                });

                if (item.isGroup === true) {
                    const groupItemList = await obs.call("GetGroupSceneItemList", {
                        sceneName: item.sourceName as string
                    });

                    const groupItems = groupItemList.sceneItems.map(gi => ({
                        id: gi.sceneItemId as number,
                        name: gi.sourceName as string,
                        groupName: item.sourceName as string
                    }));

                    data[scene.sceneName as string].push(...groupItems);
                }
            }
        }
        return data;
    } catch (error) {
        return null;
    }
}

export async function getSourceVisibility(
    sceneName: string,
    sourceId: number
): Promise<boolean | null> {
    if (!connected) {
        return null;
    }
    try {
        const sceneItemProperties = await obs.call("GetSceneItemEnabled", {
            sceneName,
            sceneItemId: sourceId
        });
        return sceneItemProperties?.sceneItemEnabled;
    } catch (error) {
        logger.error("Failed to get scene item properties", error);
        return null;
    }
}

export async function setSourceVisibility(
    sceneName: string,
    sourceId: number,
    visible: boolean
): Promise<void> {
    if (!connected) {
        return;
    }
    try {
        await obs.call("SetSceneItemEnabled", {
            sceneItemEnabled: visible,
            sceneName,
            sceneItemId: sourceId
        });
    } catch (error) {
        logger.error("Failed to set scene item properties", error);
    }
}

type OBSFilter = {
    enabled: boolean;
    name: string;
};

type OBSFilterData = {
    filterName: string;
    filterEnabled: boolean;
    filterIndex: number;
    filterKind: string;
    filterSettings: unknown;
};

export type OBSSource = {
    name: string;
    type: string;
    typeId: string;
    filters: Array<OBSFilter>;
};

export type OBSSceneItem = {
    id: number;
    name: string;
};

export type OBSTextSourceSettings = {
    text?: string;
    readFromFile?: boolean;
    file?: string;
};

export type OBSBrowserSourceSettings = {
    url: string;
};

export type OBSImageSourceSettings = {
    file: string;
};

export type OBSMediaSourceSettings = {
    isLocalFile: boolean;
    localFile?: string;
    loop?: boolean;
};

export type OBSColorSourceSettings = {
    color: number;
};

export type OBSSourceScreenshotSettings = {
    sourceName: string;
    imageFormat: string;
    imageWidth?: number;
    imageHeight?: number;
    imageCompressionQuality?: number;
}

export type OBSSourceTransformKeys =
    | "positionX"
    | "positionY"
    | "scaleX"
    | "scaleY"
    | "rotation";

export async function getAllSources(): Promise<Array<OBSSource> | null> {
    if (!connected) {
        return null;
    }
    try {
        const sourceListData = await obs.call("GetInputList");
        if (sourceListData?.inputs == null) {
            return null;
        }
        const sources: OBSSource[] = sourceListData.inputs.map(i => ({
            name: i.inputName as string,
            type: i.inputKind as string,
            typeId: i.inputKind as string,
            filters: []
        }));

        const sceneNameList = await getSceneList();
        sources.push(
            ...sceneNameList.map(
                s =>
                    ({
                        name: s,
                        filters: [],
                        type: "scene",
                        typeId: "scene"
                    } as OBSSource)
            )
        );

        for (const source of sources) {
            const sourceFiltersData = await obs.call("GetSourceFilterList", {
                sourceName: source.name
            });
            source.filters = (
                sourceFiltersData.filters as unknown as Array<OBSFilterData>
            ).map(f => ({ name: f.filterName, enabled: f.filterEnabled }));
        }
        return sources;
    } catch (error) {
        logger.error("Failed to get all sources", error);
        return null;
    }
}

export async function getAllSceneItemsInScene(sceneName: string): Promise<Array<OBSSceneItem>> {
    try {
        const response = await obs.call("GetSceneItemList", { sceneName });
        return response.sceneItems.map(item => ({
            id: item.sceneItemId as number,
            name: item.sourceName as string
        }));
    } catch (error) {
        logger.error(`Failed to get OBS scene items in scene "${sceneName}"`, error);
        return null;
    }
}

export async function getSceneItem(sceneName: string, sceneItemId: number): Promise<OBSSceneItem> {
    try {
        const sceneItems = await getAllSceneItemsInScene(sceneName);
        return sceneItems.find(item => item.id === sceneItemId);
    } catch (error) {
        logger.error(`Failed to get OBS scene item ${sceneItemId} in scene "${sceneName}"`, error);
        return null;
    }
}

export async function getSourcesWithFilters(): Promise<Array<OBSSource>> {
    const sources = await getAllSources();
    return sources?.filter(s => s.filters?.length > 0);
}

export async function getFilterEnabledStatus(
    sourceName: string,
    filterName: string
): Promise<boolean | null> {
    if (!connected) {
        return null;
    }
    try {
        const filterInfo = await obs.call("GetSourceFilter", {
            sourceName,
            filterName
        });
        return filterInfo?.filterEnabled;
    } catch (error) {
        logger.error("Failed to get filter info", error);
        return null;
    }
}

export async function setFilterEnabled(
    sourceName: string,
    filterName: string,
    filterEnabled: boolean
): Promise<void> {
    if (!connected) {
        return;
    }
    try {
        await obs.call("SetSourceFilterEnabled", {
            sourceName,
            filterName,
            filterEnabled
        });
    } catch (error) {
        logger.error("Failed to set filter enable status", error);
    }
}

async function getSourceTypes() {
    try {
        const sourceTypes = await obs.call("GetInputKindList");
        return sourceTypes.inputKinds;
    } catch (error) {
        logger.error("Failed to get source types list", error);
        return [];
    }
}

export async function getAudioSources(): Promise<Array<OBSSource>> {
    const sources = await getAllSources();
    const audioSupportedSources = [];
    for (const source of sources) {
        try {
            const getMonitorResponse = await obs.call("GetInputAudioMonitorType", {
                inputName: source.name
            });
            if (getMonitorResponse?.monitorType != null) {
                audioSupportedSources.push(source);
            }
        } catch (e) {}
    }

    return audioSupportedSources;
}

export async function getTransformableSceneItems(sceneName: string): Promise<Array<OBSSceneItem>> {
    const sceneItems = await getAllSceneItemsInScene(sceneName) ?? [];
    const sources = (await getAllSources()) ?? [];

    return sceneItems.filter(item => sources.some(source => source.name === item.name && !source.typeId.startsWith("wasapi")));
}

const transformWebsocketRequest = (sceneName: string, sceneItemId: number, sceneItemTransform: Record<OBSSourceTransformKeys, number>) => ({
    requestType: "SetSceneItemTransform",
    requestData: {
        sceneName,
        sceneItemId,
        sceneItemTransform
    }
});

// For future Oshi or someone who thinks up a clean solution to this, this method should ultimately allow
// for any two OBS websocket payloads of the same type to be passed in, and will create a lerped response between
// them both, not be opinionated to just work with Transform.
function getLerpedCallsArray(
    sceneName: string,
    sceneItemId: number,
    transformStart: Record<string, number>,
    transformEnd: Record<string, number>,
    duration: number,
    easeIn = false,
    easeOut = false
) {
    if (!duration) {
        return [
            transformWebsocketRequest(
                sceneName,
                sceneItemId,
                transformEnd && Object.keys(transformEnd).length
                    ? transformEnd
                    : transformStart
            )
        ];
    }

    const calls = [];
    const interval = 1 / 60;

    calls.push(transformWebsocketRequest(sceneName, sceneItemId, transformStart));
    if (!transformEnd || !Object.keys(transformEnd).length) {
        return calls;
    }

    let time = 0;
    do {
        const delay = Math.min(interval * 1000, duration - time);
        const frame: Record<string, number> = {};

        calls.push({
            requestType: "Sleep",
            requestData: { sleepMillis: delay }
        });

        time += delay;
        Object.keys(transformEnd).forEach((key) => {
            if (transformStart[key] === transformEnd[key]) {
                return;
            }
            let ratio = time / duration;
            if (easeIn && easeOut) {
                ratio = ratio < 0.5 ? 2 * ratio * ratio : -1 + (4 - 2 * ratio) * ratio;
            } else if (easeIn) {
                ratio = ratio * ratio;
            } else if (easeOut) {
                ratio = ratio * (2 - ratio);
            }
            frame[key] = transformStart[key] + (transformEnd[key] - transformStart[key]) * ratio;
        });

        calls.push(transformWebsocketRequest(sceneName, sceneItemId, frame));
    } while (time < duration);
    return calls;
}

export async function transformSceneItem(
    sceneName: string,
    sceneItemId: number,
    duration: number,
    transformStart: Record<string, number>,
    transformEnd: Record<string, number>,
    easeIn: boolean,
    easeOut: boolean
) {
    try {
        const currentTransform = (await obs.call("GetSceneItemTransform", {
            sceneName,
            sceneItemId
        })).sceneItemTransform;

        Object.keys(transformEnd).forEach((key) => {
            if (!transformStart.hasOwnProperty(key)) {
                transformStart[key] = Number(currentTransform[key]);
            }
            if (transformEnd[key] === transformStart[key]) {
                delete transformEnd[key];
            }
        });

        const calls = getLerpedCallsArray(sceneName, sceneItemId, transformStart, transformEnd, duration, easeIn, easeOut);
        await obs.callBatch(calls);
    } catch (error) {
        logger.error("Failed to transform scene item", error);
    }
}

export async function toggleSourceMuted(sourceName: string) {
    try {
        await obs.call("ToggleInputMute", {
            inputName: sourceName
        });
    } catch (error) {
        logger.error("Failed to toggle mute for source", error);
    }
}

export async function setSourceMuted(sourceName: string, muted: boolean) {
    try {
        await obs.call("SetInputMute", {
            inputName: sourceName,
            inputMuted: muted
        });
    } catch (error) {
        logger.error("Failed to set mute for source", error);
    }
}

export async function getTextSources(): Promise<Array<OBSSource>> {
    const sources = await getAllSources();
    return sources?.filter(s => TEXT_SOURCE_IDS.includes(s.typeId));
}

export async function setTextSourceSettings(sourceName: string, settings: OBSTextSourceSettings) {
    try {
        const source = await obs.call("GetInputSettings", {
            inputName: sourceName
        });

        if (source.inputKind === "text_ft2_source_v2") {
            await obs.call("SetInputSettings", {
                inputName: sourceName,
                inputSettings: {
                    from_file: settings.readFromFile, // eslint-disable-line camelcase
                    text: settings.text,
                    text_file: settings.file // eslint-disable-line camelcase
                }
            });
        } else {
            await obs.call("SetInputSettings", {
                inputName: sourceName,
                inputSettings: {
                    read_from_file: settings.readFromFile, // eslint-disable-line camelcase
                    text: settings.text,
                    file: settings.file
                }
            });
        }
    } catch (error) {
        logger.error("Failed to set text for source", error);
    }
}

export async function createRecordChapter(chapterName: string) {
    try {
        // obs-websockets-js hasn't been updated to include "CreateRecordChapter" yet
        // @ts-expect-error
        await obs.call("CreateRecordChapter", {
            chapterName
        });
    } catch (error) {
        if (error.code === 501) {
            logger.error("Failed to create OBS Chapter Marker: Output Not Running");
        } else if (error.code === 204) {
            logger.error("Failed to create OBS Chapter Marker: Outdated OBS version");
        } else {
            logger.error("Failed to create OBS Chapter Marker:", error.message ?? error);
        }
    }
}

export async function getBrowserSources(): Promise<Array<OBSSource>> {
    const sources = await getAllSources();
    return sources?.filter(s => s.typeId === "browser_source");
}

export async function setBrowserSourceSettings(sourceName: string, settings: OBSBrowserSourceSettings) {
    try {
        await obs.call("SetInputSettings", {
            inputName: sourceName,
            inputSettings: {
                url: settings.url
            }
        });
    } catch (error) {
        logger.error("Failed to set URL for source", error);
    }
}

export async function getImageSources(): Promise<Array<OBSSource>> {
    const sources = await getAllSources();
    return sources?.filter(s => s.typeId === "image_source");
}

export async function setImageSourceSettings(sourceName: string, settings: OBSImageSourceSettings) {
    try {
        await obs.call("SetInputSettings", {
            inputName: sourceName,
            inputSettings: {
                file: settings.file
            }
        });
    } catch (error) {
        logger.error("Failed to set file for image source", error);
    }
}

export async function getMediaSources(): Promise<Array<OBSSource>> {
    const sources = await getAllSources();
    return sources?.filter(s => s.typeId === "ffmpeg_source");
}

export async function setMediaSourceSettings(sourceName: string, settings: OBSMediaSourceSettings) {
    try {
        await obs.call("SetInputSettings", {
            inputName: sourceName,
            inputSettings: {
                is_local_file: settings.isLocalFile, // eslint-disable-line camelcase
                local_file: settings.localFile, // eslint-disable-line camelcase
                looping: settings.loop
            }
        });
    } catch (error) {
        logger.error("Failed to set file for media source", error);
    }
}

export async function getColorSources(): Promise<Array<OBSSource>> {
    const sources = await getAllSources();
    return sources?.filter(s => s.typeId === "color_source_v3");
}

export async function setColorSourceSettings(sourceName: string, settings: OBSColorSourceSettings) {
    try {
        await obs.call("SetInputSettings", {
            inputName: sourceName,
            inputSettings: {
                color: settings.color
            }
        });
    } catch (error) {
        logger.error("Failed to set color for source", error);
    }
}

export async function getStreamingStatus(): Promise<boolean> {
    if (!connected) {
        return false;
    }
    try {
        const streamingStatus = await obs.call("GetStreamStatus");
        return streamingStatus.outputActive;
    } catch (error) {
        logger.error("Failed to get streaming status", error);
        return false;
    }
}

export async function startStreaming(): Promise<void> {
    if (!connected) {
        return;
    }
    try {
        await obs.call("StartStream");
    } catch (error) {
        logger.error("Failed to start streaming", error);
        return;
    }
}

export async function stopStreaming(): Promise<void> {
    if (!connected) {
        return;
    }
    try {
        await obs.call("StopStream");
    } catch (error) {
        logger.error("Failed to stop streaming", error);
        return;
    }
}

export async function startVirtualCam(): Promise<void> {
    if (!connected) {
        return;
    }
    try {
        await obs.call("StartVirtualCam");
    } catch (error) {
        logger.error("Failed to start virtual camera", error);
        return;
    }
}

export async function stopVirtualCam(): Promise<void> {
    if (!connected) {
        return;
    }
    try {
        await obs.call("StopVirtualCam");
    } catch (error) {
        logger.error("Failed to stop virtual camera", error);
        return;
    }
}

export const isConnected = (): boolean => connected;

export async function isStreaming(): Promise<boolean> {
    let isRunning = false;
    if (!connected) {
        return isRunning;
    }
    try {
        const response = await obs.call("GetStreamStatus");
        isRunning = response.outputActive;
    } catch (error) {
        logger.error("Failed to get OBS stream status", error);
    }

    return isRunning;
}

export async function isRecording(): Promise<boolean> {
    let isRunning = false;
    if (!connected) {
        return isRunning;
    }
    try {
        const response = await obs.call("GetRecordStatus");
        isRunning = response.outputActive;
    } catch (error) {
        logger.error("Failed to get OBS record status", error);
    }

    return isRunning;
}

export async function saveReplayBuffer(): Promise<boolean> {
    try {
        await obs.call("SaveReplayBuffer");
    } catch (error) {
        logger.error("Failed to save OBS replay buffer", error);
        return false;
    }

    return true;
}

export type ObsRawResponse = { success: boolean; response?: string; }

export async function sendRawObsRequest(functionName: string, payload?: string): Promise<ObsRawResponse> {
    const rawResponse: ObsRawResponse = { success: false };

    if (!connected) {
        return rawResponse;
    }

    try {
    // Attempt to parse it out first
        let formattedPayload = null;
        try {
            formattedPayload = JSON.parse(payload);
        } catch (error) { }

        if (formattedPayload == null) {
            formattedPayload = payload;
        }

        /** @ts-ignore */
        const response = await obs.call(functionName, formattedPayload);
        rawResponse.response = JSON.stringify(response);
        rawResponse.success = true;
    } catch (error) {
        logger.error("Failed to send raw OBS request", error);
    }

    return rawResponse;
}

/**
 * We ask OBS to return the base64 encoded image rather than save a screenshot
 * to account for multi-PC setups where Firebot and OBS aren't on the same machine.
 */
export async function takeSourceScreenshot(settings: OBSSourceScreenshotSettings): Promise<string> {
    if (!connected) {
        return null;
    }
    try {
        return (await obs.call("GetSourceScreenshot", settings)).imageData;
    } catch (error) {
        logger.error("Failed to take OBS Source Screenshot: ", error);
        return null;
    }
}

export async function getSupportedImageFormats(): Promise<string[]> {
    if (!connected) {
        return null;
    }
    try {
        return (await obs.call("GetVersion")).supportedImageFormats;
    } catch (error) {
        logger.error("Failed to get OBS supported image formats: ", error);
        return null;
    }
}