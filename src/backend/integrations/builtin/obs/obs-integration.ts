import { TypedEmitter } from "tiny-typed-emitter";
import {
    Integration,
    IntegrationController,
    IntegrationData,
    IntegrationEvents
} from "@crowbartools/firebot-custom-scripts-types";
import { EventManager } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-manager";

import logger from "../../../logwrapper";
import effectManager from "../../../effects/effectManager";
import eventManager from "../../../events/EventManager";
import eventFilterManager from "../../../events/filters/filter-manager";
import replaceVariableManager from "../../../variables/replace-variable-manager";
import frontendCommunicator from "../../../common/frontend-communicator";

import { initRemote } from "./obs-remote";
import { setupFrontendListeners } from "./communicator";

import { ChangeSceneEffectType } from "./effects/change-scene-effect-type";
import { ChangeSceneCollectionEffectType } from "./effects/change-scene-collection";
import { CreateRecordChapter } from "./effects/create-recording-chapter";
import { ToggleSourceVisibilityEffectType } from "./effects/toggle-obs-source-visibility";
import { ToggleSourceFilterEffectType } from "./effects/toggle-obs-source-filter";
import { ToggleSourceMutedEffectType } from "./effects/toggle-obs-source-muted";
import { TransformSourceEffectType } from "./effects/transform-obs-source";
import { StartStreamEffectType } from "./effects/start-stream";
import { StopStreamEffectType } from "./effects/stop-stream";
import { StartVirtualCamEffectType } from "./effects/start-virtual-cam";
import { StopVirtualCamEffectType } from "./effects/stop-virtual-cam";
import { SaveReplayBufferEffectType } from "./effects/save-replay-buffer";
import { SetOBSSourceTextEffectType } from "./effects/set-obs-source-text";
import { SetOBSBrowserSourceUrlEffectType } from "./effects/set-obs-browser-source-url";
import { SetOBSImageSourceFileEffectType } from "./effects/set-obs-image-source-file";
import { SetOBSMediaSourceFileEffectType } from "./effects/set-obs-media-source-file";
import { SetOBSColorSourceColorEffectType } from "./effects/set-obs-color-source-color";
import { SendRawOBSWebSocketRequestEffectType } from "./effects/send-raw-obs-websocket-request";
import { TakeOBSSourceScreenshotEffectType } from "./effects/take-obs-source-screenshot";

import { OBSEventSource } from "./events/obs-event-source";

import { GroupNameEventFilter } from "./filters/group-name-filter";
import { SceneNameEventFilter } from "./filters/scene-name-filter";

import { SceneNameVariable } from "./variables/scene-name-variable";
import { SceneCollectionNameVariable } from "./variables/scene-collection-name";
import { IsConnectedVariable } from "./variables/is-connected";
import { IsStreamingVariable } from "./variables/is-streaming";
import { IsRecordingVariable } from "./variables/is-recording";
import { ColorValueVariable } from "./variables/obs-color-value";
import { SceneItemIdVariable } from "./variables/scene-item-id";
import { SceneItemNameVariable } from "./variables/scene-item-name";
import { SceneItemEnabledVariable } from "./variables/scene-item-enabled";
import { TransitionNameVariable } from "./variables/transition-name";
import { TransitionDurationVariable } from "./variables/transition-duration";
import { ReplayBufferPathVariable } from "./variables/replay-buffer-path";
import { ProfileNameVariable } from "./variables/profile-name";
import { VendorNameVariable } from "./variables/vendor-name";
import { VendorEventTypeVariable } from "./variables/vendor-event-type";
import { VendorEventDataVariable } from "./variables/vendor-event-data";
import { InputNameVariable } from "./variables/input-name";
import { InputUuidVariable } from "./variables/input-uuid";
import { InputKindVariable } from "./variables/input-kind";
import { OldInputNameVariable } from "./variables/old-input-name";
import { InputSettingsVariable } from "./variables/input-settings";
import { InputActiveVariable } from "./variables/input-active";
import { InputShowingVariable } from "./variables/input-showing";
import { InputMutedVariable } from "./variables/input-muted";
import { InputVolumeDbVariable } from "./variables/input-volume-db";
import { InputVolumeMultiplierVariable } from "./variables/input-volume-multiplier";
import { InputAudioBalanceVariable } from "./variables/input-audio-balance";
import { InputAudioSyncOffsetVariable } from "./variables/input-audio-sync-offset";
import { InputAudioTracksVariable } from "./variables/input-audio-tracks";
import { InputAudioMonitorTypeVariable } from "./variables/input-audio-monitor-type";
import { GroupItemIdVariable } from "./variables/group-item-id";
import { GroupNameVariable } from "./variables/group-name";

type ObsSettings = {
    websocketSettings: {
        ipAddress: string;
        port: number;
        password: string;
    };
    misc: {
        logging: boolean;
    };
};

class IntegrationEventEmitter extends TypedEmitter<IntegrationEvents> {}

class ObsIntegration
    extends IntegrationEventEmitter
    implements IntegrationController<ObsSettings> {
    connected = false;
    private _isConfigured = false;

    constructor(private readonly eventManager: EventManager) {
        super();

        frontendCommunicator.on(
            "obs-is-configured",
            () => this._isConfigured
        );
    }

    private setupConnection(settings?: ObsSettings) {
        if (!settings) {
            this._isConfigured = false;
            return;
        }
        const {
            websocketSettings: { ipAddress, password, port },
            misc: { logging }
        } = settings;

        this._isConfigured = (
            ipAddress != null && ipAddress !== ""
            && port != null
            && password != null && password !== ""
        );
        initRemote(
            {
                ip: ipAddress,
                port,
                password,
                logging,
                forceConnect: true
            },
            {
                eventManager: this.eventManager
            }
        );
    }

    init(
        linked: boolean,
        integrationData: IntegrationData<ObsSettings>
    ): void | PromiseLike<void> {
        logger.info("Starting OBS Control...");

        setupFrontendListeners(frontendCommunicator);

        effectManager.registerEffect(ChangeSceneEffectType);
        effectManager.registerEffect(ChangeSceneCollectionEffectType);
        effectManager.registerEffect(CreateRecordChapter);
        effectManager.registerEffect(ToggleSourceVisibilityEffectType);
        effectManager.registerEffect(ToggleSourceFilterEffectType);
        effectManager.registerEffect(ToggleSourceMutedEffectType);
        effectManager.registerEffect(TransformSourceEffectType);
        effectManager.registerEffect(StartStreamEffectType);
        effectManager.registerEffect(StopStreamEffectType);
        effectManager.registerEffect(StartVirtualCamEffectType);
        effectManager.registerEffect(StopVirtualCamEffectType);
        effectManager.registerEffect(SaveReplayBufferEffectType);
        effectManager.registerEffect(SetOBSSourceTextEffectType);
        effectManager.registerEffect(SetOBSBrowserSourceUrlEffectType);
        effectManager.registerEffect(SetOBSImageSourceFileEffectType);
        effectManager.registerEffect(SetOBSMediaSourceFileEffectType);
        effectManager.registerEffect(SetOBSColorSourceColorEffectType);
        effectManager.registerEffect(SendRawOBSWebSocketRequestEffectType);
        effectManager.registerEffect(TakeOBSSourceScreenshotEffectType);

        eventManager.registerEventSource(OBSEventSource);

        eventFilterManager.registerFilter(GroupNameEventFilter);
        eventFilterManager.registerFilter(SceneNameEventFilter);

        replaceVariableManager.registerReplaceVariable(SceneNameVariable);
        replaceVariableManager.registerReplaceVariable(SceneCollectionNameVariable);
        replaceVariableManager.registerReplaceVariable(IsConnectedVariable);
        replaceVariableManager.registerReplaceVariable(IsStreamingVariable);
        replaceVariableManager.registerReplaceVariable(IsRecordingVariable);
        replaceVariableManager.registerReplaceVariable(ColorValueVariable);
        replaceVariableManager.registerReplaceVariable(GroupItemIdVariable);
        replaceVariableManager.registerReplaceVariable(GroupNameVariable);
        replaceVariableManager.registerReplaceVariable(SceneItemIdVariable);
        replaceVariableManager.registerReplaceVariable(SceneItemNameVariable);
        replaceVariableManager.registerReplaceVariable(SceneItemEnabledVariable);
        replaceVariableManager.registerReplaceVariable(TransitionNameVariable);
        replaceVariableManager.registerReplaceVariable(TransitionDurationVariable);
        replaceVariableManager.registerReplaceVariable(ReplayBufferPathVariable);
        replaceVariableManager.registerReplaceVariable(ProfileNameVariable);
        replaceVariableManager.registerReplaceVariable(VendorNameVariable);
        replaceVariableManager.registerReplaceVariable(VendorEventTypeVariable);
        replaceVariableManager.registerReplaceVariable(VendorEventDataVariable);
        replaceVariableManager.registerReplaceVariable(InputNameVariable);
        replaceVariableManager.registerReplaceVariable(InputUuidVariable);
        replaceVariableManager.registerReplaceVariable(InputKindVariable);
        replaceVariableManager.registerReplaceVariable(InputSettingsVariable);
        replaceVariableManager.registerReplaceVariable(OldInputNameVariable);
        replaceVariableManager.registerReplaceVariable(InputActiveVariable);
        replaceVariableManager.registerReplaceVariable(InputShowingVariable);
        replaceVariableManager.registerReplaceVariable(InputMutedVariable);
        replaceVariableManager.registerReplaceVariable(InputVolumeDbVariable);
        replaceVariableManager.registerReplaceVariable(InputVolumeMultiplierVariable);
        replaceVariableManager.registerReplaceVariable(InputAudioBalanceVariable);
        replaceVariableManager.registerReplaceVariable(InputAudioSyncOffsetVariable);
        replaceVariableManager.registerReplaceVariable(InputAudioTracksVariable);
        replaceVariableManager.registerReplaceVariable(InputAudioMonitorTypeVariable);

        this.setupConnection(integrationData.userSettings);
    }

    onUserSettingsUpdate?(
        integrationData: IntegrationData<ObsSettings>
    ): void | PromiseLike<void> {
        this.setupConnection(integrationData.userSettings);
    }
}

const integrationConfig: Integration<ObsSettings> = {
    definition: {
        id: "OBS",
        name: "OBS",
        description:
      "Connect to OBS to allow Firebot to change scenes, toggle sources and filters, and much more. Requires OBS 28+ or the obs-websocket v5 plugin.",
        linkType: "none",
        configurable: true,
        connectionToggle: false,
        settingCategories: {
            websocketSettings: {
                title: "Websocket Settings",
                sortRank: 1,
                settings: {
                    ipAddress: {
                        title: "IP Address",
                        description:
              "The ip address of the computer running OBS. Use 'localhost' for the same computer.",
                        type: "string",
                        default: "localhost"
                    },
                    port: {
                        title: "Port",
                        description:
              "Port the OBS Websocket is running on. Default is 4455.",
                        type: "number",
                        default: 4455
                    },
                    password: {
                        title: "Password",
                        description: "The password set for the OBS Websocket.",
                        type: "password",
                        default: ""
                    }
                }
            },
            misc: {
                title: "Misc",
                sortRank: 2,
                settings: {
                    logging: {
                        title: "Enable logging for OBS Errors",
                        type: "boolean",
                        default: false
                    }
                }
            }
        }
    },
    integration: new ObsIntegration(eventManager)
};

export const definition = integrationConfig.definition;
export const integration = integrationConfig.integration;
