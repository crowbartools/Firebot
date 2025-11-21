import type { EffectType } from "../../../types/effects";
import type { FirebotAudioDevice } from "../../../types/settings";

import { type SoundType, playSound } from "../../common/handlers/sound-handler";

const model: EffectType<{
    soundType: SoundType;
    volume: number;
    filepath: string;
    folder: string;
    url: string;
    mimeType: string;
    rawData: string;
    overlayInstance: string;
    audioOutputDevice: FirebotAudioDevice;
    waitForSound: boolean;
}, {
    isUrl: boolean;
    url: string;
    filepath: string;
    resourceToken: string;
    volume: number;
}> = {
    definition: {
        id: "firebot:playsound",
        name: "Play Sound",
        description: "Plays a sound effect",
        icon: "fad fa-waveform",
        categories: ["common", "fun", "overlay"],
        dependencies: []
    },
    optionsTemplate: `
    <eos-container header="Type">
        <firebot-select
            options="{ local: 'Local file', folderRandom: 'Random from folder', url: 'Url', rawData: 'Raw Binary Audio Data (bytes)' }"
            selected="effect.soundType"
            style="padding-bottom: 5px;"
        />
    </eos-container>

    <div ng-hide="effect.soundType == null">
        <eos-container header="Sound" pad-top="true">
            <div ng-if="effect.soundType === 'folderRandom'">
                <file-chooser model="effect.folder" options="{ directoryOnly: true, filters: [], title: 'Select Sound Folder'}"></file-chooser>
            </div>

            <div ng-if="effect.soundType === 'local'">
                <div style="margin-bottom: 10px">
                    <file-chooser model="effect.filepath" options="{ filters: [ {name: 'Audio', extensions: ['mp3', 'ogg', 'oga', 'wav', 'flac']} ]}"></file-chooser>
                </div>
                <div>
                    <sound-player path="encodeFilePath(effect.filepath)" volume="effect.volume" output-device="effect.audioOutputDevice"></sound-player>
                </div>
            </div>

            <div ng-if="effect.soundType === 'url'">
               <firebot-input input-title="Url" model="effect.url" />
            </div>

            <div ng-if="effect.soundType === 'rawData'">
               <firebot-input input-title="MIME Type"
                    model="effect.mimeType"
                    placeholder-text="Example: audio/mpeg"
                    style="margin-bottom: 2rem;" />
               <firebot-input input-title="Binary Data"
                    model="effect.rawData"
                    placeholder-text="Variable containing binary data" />
            </div>

            <div style="padding-top:20px">
                <label class="control-fb control--checkbox"> Wait for sound to finish <tooltip text="'Wait for the sound to finish before letting the next effect play.'"></tooltip>
                    <input type="checkbox" ng-model="effect.waitForSound">
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>

        <eos-container header="Volume" pad-top="true">
            <div class="volume-slider-wrapper">
                <i class="fal fa-volume-down volume-low"></i>
                <rzslider rz-slider-model="effect.volume" rz-slider-options="{floor: 1, ceil: 10, hideLimitLabels: true, showSelectionBar: true}"></rzslider>
                <i class="fal fa-volume-up volume-high"></i>
            </div>
        </eos-container>

        <eos-audio-output-device effect="effect" pad-top="true"></eos-audio-output-device>

        <eos-overlay-instance ng-if="effect.audioOutputDevice && effect.audioOutputDevice.deviceId === 'overlay'" effect="effect" pad-top="true"></eos-overlay-instance>
    </div>
    `,
    optionsController: ($scope) => {
        if ($scope.effect.soundType == null) {
            $scope.effect.soundType = "local";
        }

        if ($scope.effect.volume == null) {
            $scope.effect.volume = 5;
        }

        $scope.encodeFilePath = (filepath: string) => {
            return filepath?.replaceAll("%", "%25").replaceAll("#", "%23");
        };
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];

        if (effect.soundType === "local" || effect.soundType == null) {
            if (effect.filepath == null || effect.filepath.length < 1) {
                errors.push("Please select a sound file.");
            }
        } else if (effect.soundType === "folderRandom") {
            if (effect.folder == null || effect.folder.length < 1) {
                errors.push("Please select a sound folder.");
            }
        } else if (effect.soundType === "url" && (effect.url == null || effect.url.trim() === "")) {
            errors.push("Please input a url.");
        } else if (effect.soundType === "rawData") {
            if (effect.mimeType == null || effect.mimeType.trim() === "") {
                errors.push("Please input a MIME type for the raw data.");
            }
            if (effect.rawData == null || effect.rawData.trim() === "") {
                errors.push("Please input a value for the raw data.");
            }
        }

        return errors;
    },
    onTriggerEvent: async (event) => {
        const effect = event.effect;

        if (effect.soundType == null) {
            effect.soundType = "local";
        }

        return await playSound({
            soundType: effect.soundType,
            filePath: effect.filepath,
            url: effect.url,
            rawData: effect.rawData,
            mimeType: effect.mimeType,
            folder: effect.folder,
            volume: effect.volume,
            overlayInstance: effect.overlayInstance,
            audioOutputDeviceId: effect.audioOutputDevice?.deviceId,
            waitForSound: effect.waitForSound
        });
    },
    /**
   * Code to run in the overlay
   */
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        event: {
            name: "sound",
            onOverlayEvent: (event) => {
                const data = event;
                const token = encodeURIComponent(data.resourceToken);
                const resourcePath = `http://${
                    window.location.hostname
                }:7472/resource/${token}`;

                // Generate UUID to use as class name.

                const elementId = uuid() as string;

                const filepath = data.isUrl ? data.url : data.filepath.toLowerCase();
                let mediaType: string | null = null;
                if (filepath.endsWith("mp3")) {
                    mediaType = "audio/mpeg";
                } else if (filepath.endsWith("ogg")) {
                    mediaType = "audio/ogg";
                } else if (filepath.endsWith("oga")) {
                    mediaType = "audio/ogg";
                } else if (filepath.endsWith("wav")) {
                    mediaType = "audio/wav";
                } else if (filepath.endsWith("flac")) {
                    mediaType = "audio/flac";
                }

                const audioElement = document.createElement("audio");
                audioElement.id = elementId;
                audioElement.src = data.isUrl ? data.url : resourcePath;
                if (mediaType) {
                    audioElement.setAttribute("type", mediaType);
                }

                // Throw audio element on page.
                document.getElementById("wrapper").append(audioElement);

                // @ts-ignore
                audioElement.volume = parseFloat(data.volume) / 10;

                audioElement.oncanplay = () => audioElement.play();

                audioElement.onended = () => {
                    document.getElementById(elementId).remove();
                };
            }
        }
    }
};

export = model;