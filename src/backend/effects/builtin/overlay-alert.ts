/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
"use strict";

import { EffectType } from "../../../types/effects";
import { SettingsManager } from "../../common/settings-manager";
import { ResourceTokenManager } from "../../resource-token-manager";
import webServer from "../../../server/http-server-manager";
import logger from "../../logwrapper";
import fs from "fs/promises";
import path from "path";
// import { parseYoutubeId } from "../../../shared/youtube-url-parser";
// import { resolveTwitchClipVideoUrl } from "../../common/handlers/twitch-clip-url-resolver";
import { playSound } from "../../common/handlers/sound-handler";
import { wait } from "../../utils";
import { ReplaceVariableManager } from "../../variables/replace-variable-manager";

interface OverlayAlertEffect {
    mediaType: "image" | "video" | "none";
    imageSourceType: "local" | "url" | "folderRandom";
    videoSourceType: "local" | "folderRandom";
    imageFile?: string;
    imageUrl?: string;
    imageFolder?: string;
    videoFile?: string;
    videoFolder?: string;
    // youtubeId?: string;
    // twitchClipUrl?: string;
    mediaScale?: number;
    muteVideo?: boolean;
    videoVolume?: number;
    text?: string;
    font?: {
        family: string;
        size: number;
        color: string;
        weight: number;
        italic: boolean;
    };
    accentColor?: string;
    accentBold?: boolean;
    accentItalic?: boolean;
    accentUnderline?: boolean;
    autoAccentVariables?: boolean;
    playSound?: boolean;
    soundType?: "local" | "url" | "folderRandom";
    soundFile?: string;
    soundUrl?: string;
    soundFolder?: string;
    soundVolume?: number;
    audioOutputDeviceId?: string;
    duration?: number;
    position?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    enterAnimation?: string;
    enterDuration?: number;
    exitAnimation?: string;
    exitDuration?: number;
    inbetweenAnimation?: string;
    inbetweenDelay?: number;
    inbetweenDuration?: number;
    inbetweenRepeat?: number;
    overlayInstance?: string;
}

type OverlayData = Pick<
    OverlayAlertEffect,
    | "mediaType"
    | "text"
    | "font"
    | "accentColor"
    | "accentBold"
    | "accentItalic"
    | "accentUnderline"
    | "autoAccentVariables"
    | "duration"
    | "position"
    | "mediaScale"
    | "enterAnimation"
    | "enterDuration"
    | "exitAnimation"
    | "exitDuration"
    | "inbetweenAnimation"
    | "inbetweenDelay"
    | "inbetweenDuration"
    | "inbetweenRepeat"
> & {
    mediaUrl?: string;
    mediaFilePath?: string;
    mediaResourceToken?: string;
    videoVolume?: number;
    overlayInstance?: string;
};

const overlayAlertStyles = `
    .firebot-overlay-alert-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }
    .firebot-overlay-alert-media {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
    }
    .firebot-overlay-alert-media img,
    .firebot-overlay-alert-media video {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }
    .firebot-overlay-alert-text {
        text-align: center;
        margin-top: 20px;
        word-wrap: break-word;
        width: 100%;
    }
`;

const effect: EffectType<OverlayAlertEffect> = {
    definition: {
        id: "firebot:overlayalert",
        name: "Overlay Alert",
        description: "Shows a customizable alert with media and text in the overlay.",
        icon: "fad fa-bell",
        categories: ["common", "overlay"],
        dependencies: [],
        keysExemptFromAutoVariableReplacement: ["text"]
    },
    optionsTemplate: `
        <eos-container header="Preview">
            <style>${overlayAlertStyles}</style>
            <div style="display:flex; align-items: center; justify-content: center; width: 100%; min-height: 200px; background: #1a1a1a; padding: 20px; border-radius: 8px;">
                <div style="max-width: 400px; width: 100%;">
                    <div class="firebot-overlay-alert-container">
                        <div class="firebot-overlay-alert-media" ng-if="getPreviewMediaSrc()" ng-style="getPreviewMediaStyle()">
                            <img ng-if="effect.mediaType === 'image'" ng-src="{{getPreviewMediaSrc()}}" style="max-height: 200px;" />
                            <video ng-if="effect.mediaType === 'video' && effect.videoSourceType === 'local'" controls style="max-height: 200px;">
                                <source ng-src="{{getPreviewMediaSrc()}}" />
                            </video>
                        </div>
                        <div
                            class="firebot-overlay-alert-text"
                            ng-if="effect.text && effect.text !== ''"
                            ng-bind-html="getPreviewTextHtml()"
                            ng-style="getPreviewTextStyle()">
                        </div>
                    </div>
                </div>
            </div>
        </eos-container>

        <eos-container header="Media" pad-top="true">
            <firebot-radio-cards
                options="mediaTypes"
                ng-model="effect.mediaType"
                grid-columns="3"
            ></firebot-radio-cards>

            <div ng-if="effect.mediaType === 'image'" class="mt-3">
                <firebot-select
                    options="{ local: 'Local file', folderRandom: 'Random from folder', url: 'Url' }"
                    selected="effect.imageSourceType"
                    style="margin-bottom: 5px;"
                />
                <div ng-if="effect.imageSourceType === 'folderRandom'">
                    <file-chooser model="effect.imageFolder" options="{ directoryOnly: true, filters: [], title: 'Select Image Folder'}"></file-chooser>
                </div>
                <div ng-if="effect.imageSourceType === 'local'">
                    <file-chooser model="effect.imageFile" options="{ filters: [{ name: 'Image', extensions: [ 'bmp', 'gif', 'jpg', 'jpeg', 'png', 'apng', 'svg', 'webp' ]}, { name: 'All Files', extensions: ['*']} ]}"></file-chooser>
                </div>
                <div ng-if="effect.imageSourceType === 'url'">
                    <firebot-input placeholder-text="Enter image URL" model="effect.imageUrl" />
                </div>
            </div>

            <div ng-if="effect.mediaType === 'video'" class="mt-3">
                <firebot-select
                    options="{ local: 'Local file', folderRandom: 'Random from folder' }"
                    selected="effect.videoSourceType"
                    style="margin-bottom: 5px;"
                />
                <div ng-if="effect.videoSourceType === 'local'">
                    <file-chooser model="effect.videoFile" options="{ filters: [ {name: 'Video', extensions: ['mp4', 'webm', 'ogv']} ]}"></file-chooser>
                </div>
                <div ng-if="effect.videoSourceType === 'folderRandom'">
                    <file-chooser model="effect.videoFolder" options="{ directoryOnly: true, filters: [], title: 'Select Video Folder'}"></file-chooser>
                </div>
                <!-- <div ng-if="effect.videoSourceType === 'youtube'">
                    <firebot-input input-title="YouTube URL/ID" model="effect.youtubeId" placeholder-text="Ex: AAYrZ69XA8c" />
                </div>
                <div ng-if="effect.videoSourceType === 'twitchClip'">
                    <firebot-input input-title="Twitch Clip URL/ID" model="effect.twitchClipUrl" placeholder-text="Ex: HealthyBlazingLyrebirdTinyFace" />
                </div> -->
            </div>

            <div ng-if="effect.mediaType !== 'none'" class="mt-3">
                <firebot-slider
                    label="Media Scale (%)"
                    ng-model="effect.mediaScale"
                    options="{ floor: 1, ceil: 100 }"
                    left-icon="fa-compress-arrows-alt"
                    right-icon="fa-expand-arrows-alt"
                />
            </div>

            <div ng-if="effect.mediaType === 'video'" class="mt-3">
                <firebot-checkbox
                    label="Mute Video"
                    model="effect.muteVideo"
                />
                <firebot-slider
                    ng-if="!effect.muteVideo"
                    label="Video Volume"
                    ng-model="effect.videoVolume"
                    options="{ floor: 1, ceil: 10 }"
                    left-icon="fa-volume-down"
                    right-icon="fa-volume-up"
                />
            </div>
        </eos-container>

        <eos-container header="Text" pad-top="true">
            <firebot-input
                model="effect.text"
                placeholder-text="Enter alert text"
                use-text-area="true"
            />
            <div class="mt-3">
                <font-options ng-model="effect.font" allow-alpha="true"></font-options>
            </div>

            <div>
                <h4>Accent Settings</h4>
                <p class="muted" style="font-size:11px;margin-bottom:10px;">
                    You can wrap text in &lt;accent&gt; tags to apply special styling. Example: &lt;accent&gt;$username&lt;/accent&gt; just followed!
                </p>
                <color-picker-input model="effect.accentColor" label="Accent Color" alpha="true"></color-picker-input>
                <div class="mt-2">
                    <firebot-checkbox
                        label="Bold"
                        model="effect.accentBold"
                    />
                    <firebot-checkbox
                        label="Italic"
                        model="effect.accentItalic"
                    />
                    <firebot-checkbox
                        label="Underline"
                        model="effect.accentUnderline"
                    />
                </div>
                <div class="mt-2">
                    <firebot-checkbox
                        label="Automatically accent $variables"
                        model="effect.autoAccentVariables"
                    />
                </div>
            </div>
        </eos-container>

        <eos-container header="Sound Effect" pad-top="true">
            <firebot-checkbox
                label="Play Sound"
                model="effect.playSound"
            />

            <div ng-if="effect.playSound">
                <firebot-select
                    options="{ local: 'Local file', folderRandom: 'Random from folder', url: 'Url' }"
                    selected="effect.soundType"
                    style="margin-bottom: 10px;"
                />

                <div ng-if="effect.soundType === 'folderRandom'">
                    <file-chooser model="effect.soundFolder" options="{ directoryOnly: true, filters: [], title: 'Select Sound Folder'}"></file-chooser>
                </div>

                <div ng-if="effect.soundType === 'local'">
                    <file-chooser model="effect.soundFile" options="{ filters: [ {name: 'Audio', extensions: ['mp3', 'ogg', 'oga', 'wav', 'flac']} ]}"></file-chooser>
                    <div style="margin-top: 10px;">
                        <sound-player path="encodeFilePath(effect.soundFile)" volume="effect.soundVolume" output-device="effect.audioOutputDeviceId"></sound-player>
                    </div>
                </div>

                <div ng-if="effect.soundType === 'url'">
                    <firebot-input placeholder-text="Enter sound URL" model="effect.soundUrl" />
                </div>

                <div class="mt-3">
                    <firebot-slider
                        label="Volume"
                        ng-model="effect.soundVolume"
                        options="{ floor: 1, ceil: 10 }"
                        left-icon="fa-volume-down"
                        right-icon="fa-volume-up"
                    />
                </div>

                <div class="mt-3">
                    <label class="form-label" style="margin-bottom: 0;display: block;">Output Device</label>
                    <firebot-audio-output-device-select
                        device-id="effect.audioOutputDeviceId"
                    ></firebot-audio-output-device-select>
                </div>
            </div>
        </eos-container>

        <eos-container header="Duration" pad-top="true">
            <firebot-input
                input-title="Seconds"
                model="effect.duration"
                placeholder-text="Enter duration"
                menu-position="under"
                data-type="number"
            />
        </eos-container>

        <eos-container header="Position & Size" pad-top="true">
            <div class="pt-4">
                <overlay-position-editor
                    model="effect.position"
                    min-width="100"
                    min-height="100"
                    default-aspect-ratio="{ width: 16, height: 9 }"
                >
                </overlay-position-editor>
            </div>
        </eos-container>

        <eos-enter-exit-animations effect="effect" class="setting-padtop"></eos-enter-exit-animations>

        <eos-overlay-instance effect="effect" class="setting-padtop"></eos-overlay-instance>

        <eos-container>
            <div class="effect-info alert alert-warning">
                This effect requires the Firebot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal(effect.overlayInstance)" style="text-decoration:underline">Learn more</a>
            </div>
        </eos-container>
    `,
    optionsController: ($scope, $sce, utilityService) => {
        $scope.mediaTypes = [
            {
                value: "image",
                label: "Image/GIF",
                iconClass: "fa-image"
            },
            {
                value: "video",
                label: "Video",
                iconClass: "fa-video"
            },
            {
                value: "none",
                label: "None",
                iconClass: "fa-ban"
            }
        ];

        // Initialize defaults
        if ($scope.effect.mediaType == null) {
            $scope.effect.mediaType = "image";
        }

        if ($scope.effect.imageSourceType == null) {
            $scope.effect.imageSourceType = "local";
        }

        if ($scope.effect.videoSourceType == null) {
            $scope.effect.videoSourceType = "local";
        }

        if ($scope.effect.duration == null) {
            $scope.effect.duration = 5;
        }

        if ($scope.effect.videoVolume == null) {
            $scope.effect.videoVolume = 5;
        }

        if ($scope.effect.font == null) {
            $scope.effect.font = {
                family: "Open Sans",
                size: 24,
                color: "#FFFFFF",
                weight: 400,
                italic: false
            };
        }

        if ($scope.effect.accentColor == null) {
            $scope.effect.accentColor = "#FFD700";
        }

        if ($scope.effect.soundType == null) {
            $scope.effect.soundType = "local";
        }

        if ($scope.effect.soundVolume == null) {
            $scope.effect.soundVolume = 5;
        }

        if ($scope.effect.mediaScale == null) {
            $scope.effect.mediaScale = 100;
        }

        $scope.showOverlayInfoModal = function (overlayInstance: string) {
            utilityService.showOverlayInfoModal(overlayInstance);
        };

        $scope.encodeFilePath = (filepath: string) => {
            return filepath?.replaceAll("%", "%25").replaceAll("#", "%23");
        };

        // Get preview media source
        $scope.getPreviewMediaSrc = function () {
            if ($scope.effect.mediaType === "image") {
                if ($scope.effect.imageSourceType === "url" && $scope.effect.imageUrl) {
                    return $scope.effect.imageUrl;
                } else if ($scope.effect.imageSourceType === "local" && $scope.effect.imageFile) {
                    return `file:///${$scope.effect.imageFile.replace(/\\/g, "/")}`;
                }
            } else if ($scope.effect.mediaType === "video") {
                if ($scope.effect.videoSourceType === "local" && $scope.effect.videoFile) {
                    return `file:///${$scope.effect.videoFile.replace(/\\/g, "/")}`;
                }
            }
            return null;
        };

        // Get preview media style (for scale)
        $scope.getPreviewMediaStyle = function () {
            const scale = $scope.effect.mediaScale || 100;
            return {
                width: `${scale}%`
            };
        };

        // Process text with accent tags for preview
        function processAccentTags(text: string, autoAccent: boolean) {
            if (!text) {
                return "";
            }

            let processedText = text;

            // Convert newlines to <br /> tags
            processedText = processedText.replace(/\n/g, "<br />");


            // Auto-accent variables if enabled
            if (autoAccent) {
                // Match $variable with optional arguments, including nested variables
                // This regex handles: $var, $var[arg], $var[$nested[arg], arg2], etc.
                processedText = processedText.replace(
                    /\$[a-zA-Z0-9_]+(?:\[(?:[^[\]]|\[(?:[^[\]]|\[[^[\]]*\])*\])*\])?/g,
                    (match) => {
                        return `<accent>${match}</accent>`;
                    }
                );
            }

            // Apply accent styling
            const accentStyle = [];
            if ($scope.effect.accentColor) {
                accentStyle.push(`color: ${$scope.effect.accentColor}`);
            }
            if ($scope.effect.accentBold) {
                accentStyle.push("font-weight: bold");
            }
            if ($scope.effect.accentItalic) {
                accentStyle.push("font-style: italic");
            }
            if ($scope.effect.accentUnderline) {
                accentStyle.push("text-decoration: underline");
            }

            const styleAttr = accentStyle.length > 0 ? ` style="${accentStyle.join("; ")}"` : "";
            processedText = processedText.replace(/<accent>(.*?)<\/accent>/g, `<span${styleAttr}>$1</span>`);

            return processedText;
        }

        // Get preview text HTML
        $scope.getPreviewTextHtml = function () {
            if (!$scope.effect.text) {
                return "";
            }
            const processedText = processAccentTags($scope.effect.text, $scope.effect.autoAccentVariables);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return $sce.trustAsHtml(processedText);
        };

        // Get preview text style
        $scope.getPreviewTextStyle = function () {
            const font = $scope.effect.font ?? ({} as typeof $scope.effect.font);
            return {
                fontFamily: font.family || "Open Sans",
                fontSize: `${font.size || 24}px`,
                color: font.color || "#FFFFFF",
                fontWeight: font.weight || 400,
                fontStyle: font.italic ? "italic" : "normal"
            };
        };
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];

        if (effect.mediaType === "image") {
            if (effect.imageSourceType === "local" && !effect.imageFile) {
                errors.push("Please select an image file.");
            } else if (effect.imageSourceType === "url" && !effect.imageUrl) {
                errors.push("Please enter an image URL.");
            } else if (effect.imageSourceType === "folderRandom" && !effect.imageFolder) {
                errors.push("Please select an image folder.");
            }
        } else if (effect.mediaType === "video") {
            if (effect.videoSourceType === "local" && !effect.videoFile) {
                errors.push("Please select a video file.");
                // } else if (effect.videoSourceType === "youtube" && !effect.youtubeId) {
                //     errors.push("Please enter a YouTube URL or ID.");
                // } else if (effect.videoSourceType === "twitchClip" && !effect.twitchClipUrl) {
                //     errors.push("Please enter a Twitch Clip URL or ID.");
            } else if (effect.videoSourceType === "folderRandom" && !effect.videoFolder) {
                errors.push("Please select a video folder.");
            }
        }

        if (!effect.text && effect.mediaType === "none") {
            errors.push("Please add either media or text to your alert.");
        }

        if (effect.playSound) {
            if (effect.soundType === "local" && !effect.soundFile) {
                errors.push("Please select a sound file.");
            } else if (effect.soundType === "url" && !effect.soundUrl) {
                errors.push("Please enter a sound URL.");
            } else if (effect.soundType === "folderRandom" && !effect.soundFolder) {
                errors.push("Please select a sound folder.");
            }
        }

        return errors;
    },
    onTriggerEvent: async (event) => {
        const effect = event.effect;

        if (effect?.text?.length) {
            if (effect.autoAccentVariables) {
                // Match $variable with optional arguments, including nested variables
                // This regex handles: $var, $var[arg], $var[$nested[arg], arg2], etc.
                effect.text = effect.text.replace(
                    /\$[a-zA-Z0-9_]+(?:\[(?:[^[\]]|\[(?:[^[\]]|\[[^[\]]*\])*\])*\])?/g,
                    (match) => {
                        return `<accent>${match}</accent>`;
                    }
                );
            }

            effect.text = await ReplaceVariableManager.populateStringWithTriggerData(effect.text, {
                ...event.trigger,
                effectOutputs: event.outputs
            });
        }

        const data: OverlayData = {
            mediaType: effect.mediaType,
            text: effect.text,
            font: effect.font,
            accentColor: effect.accentColor,
            accentBold: effect.accentBold,
            accentItalic: effect.accentItalic,
            accentUnderline: effect.accentUnderline,
            autoAccentVariables: effect.autoAccentVariables,
            duration: effect.duration || 5,
            position: effect.position,
            mediaScale: effect.mediaScale || 100,
            enterAnimation: effect.enterAnimation,
            enterDuration: effect.enterDuration,
            exitAnimation: effect.exitAnimation,
            exitDuration: effect.exitDuration,
            inbetweenAnimation: effect.inbetweenAnimation,
            inbetweenDelay: effect.inbetweenDelay,
            inbetweenDuration: effect.inbetweenDuration,
            inbetweenRepeat: effect.inbetweenRepeat
        };

        if (SettingsManager.getSetting("UseOverlayInstances")) {
            if (effect.overlayInstance != null) {
                if (SettingsManager.getSetting("OverlayInstances").includes(effect.overlayInstance)) {
                    data.overlayInstance = effect.overlayInstance;
                }
            }
        }

        // Handle media sources
        if (effect.mediaType === "image") {
            if (effect.imageSourceType === "url") {
                data.mediaUrl = effect.imageUrl;
            } else if (effect.imageSourceType === "local") {
                data.mediaFilePath = effect.imageFile;
                data.mediaResourceToken = ResourceTokenManager.storeResourcePath(effect.imageFile, 30);
            } else if (effect.imageSourceType === "folderRandom") {
                try {
                    const files = await fs.readdir(effect.imageFolder);
                    const imageFiles = files.filter((f) => {
                        const ext = path.extname(f).toLowerCase();
                        return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".apng"].includes(ext);
                    });
                    if (imageFiles.length > 0) {
                        const randomFile = imageFiles[Math.floor(Math.random() * imageFiles.length)];
                        const fullPath = path.join(effect.imageFolder, randomFile);
                        data.mediaFilePath = fullPath;
                        data.mediaResourceToken = ResourceTokenManager.storeResourcePath(fullPath, 30);
                    } else {
                        logger.warn("No image files found in folder:", effect.imageFolder);
                        return false;
                    }
                } catch (err) {
                    logger.error("Failed to read image folder:", err);
                    return false;
                }
            }
        } else if (effect.mediaType === "video") {
            if (effect.videoSourceType === "local") {
                data.mediaFilePath = effect.videoFile;
                data.mediaResourceToken = ResourceTokenManager.storeResourcePath(effect.videoFile, 30);
                data.videoVolume = effect.muteVideo ? 0 : effect.videoVolume || 5;
            } else if (effect.videoSourceType === "folderRandom") {
                try {
                    const files = await fs.readdir(effect.videoFolder);
                    const videoFiles = files.filter((f) => {
                        const ext = path.extname(f).toLowerCase();
                        return [".mp4", ".webm", ".ogv"].includes(ext);
                    });
                    if (videoFiles.length > 0) {
                        const randomFile = videoFiles[Math.floor(Math.random() * videoFiles.length)];
                        const fullPath = path.join(effect.videoFolder, randomFile);
                        data.mediaFilePath = fullPath;
                        data.mediaResourceToken = ResourceTokenManager.storeResourcePath(fullPath, 30);
                        data.videoVolume = effect.muteVideo ? 0 : effect.videoVolume || 5;
                    } else {
                        logger.warn("No video files found in folder:", effect.videoFolder);
                        return false;
                    }
                } catch (err) {
                    logger.error("Failed to read video folder:", err);
                    return false;
                }
            }
            // } else if (effect.videoSourceType === "youtube") {
            //     data.youtubeId = parseYoutubeId(effect.youtubeId);
            //     data.videoVolume = effect.muteVideo ? 0 : (effect.videoVolume || 5);
            // } else if (effect.videoSourceType === "twitchClip") {
            //     const { TwitchApi } = await import("../../streaming-platforms/twitch/api");

            //     const clip = await TwitchApi.clips.getClipFromClipUrl(effect.twitchClipUrl);

            //     if (clip == null) {
            //         logger.error("Unable to find clip");
            //         return true;
            //     }

            //     try {
            //         const { url } = await resolveTwitchClipVideoUrl(clip);
            //         if (url) {
            //             data.mediaUrl = url;
            //             data.videoVolume = effect.muteVideo ? 0 : (effect.videoVolume || 5);
            //         } else {
            //             logger.warn("Failed to resolve Twitch clip URL");
            //             return false;
            //         }
            //     } catch (err) {
            //         logger.error("Failed to resolve Twitch clip:", err);
            //         return false;
            //     }
            // }
        }

        webServer.sendToOverlay("overlayalert", data);

        // Handle sound effect
        if (effect.playSound) {
            void playSound({
                soundType: effect.soundType,
                filePath: effect.soundFile,
                url: effect.soundUrl,
                folder: effect.soundFolder,
                volume: effect.soundVolume,
                audioOutputDeviceId: effect.audioOutputDeviceId,
                overlayInstance: data.overlayInstance,
                waitForSound: false
            });
        }

        await wait(data.duration * 1000);

        return true;
    },
    overlayExtension: {
        dependencies: {
            css: [],
            globalStyles: overlayAlertStyles,
            js: []
        },
        event: {
            name: "overlayalert",
            onOverlayEvent: (event: OverlayData) => {
                const data = event;

                function processAccentTags(
                    text: string,
                    accentColor: string,
                    accentBold: boolean,
                    accentItalic: boolean,
                    accentUnderline: boolean
                ) {
                    if (!text) {
                        return "";
                    }

                    let processedText = text;

                    // Convert newlines to <br /> tags
                    processedText = processedText.replace(/\n/g, "<br />");

                    // Apply accent styling
                    const accentStyle = [];
                    if (accentColor) {
                        accentStyle.push(`color: ${accentColor}`);
                    }
                    if (accentBold) {
                        accentStyle.push("font-weight: bold");
                    }
                    if (accentItalic) {
                        accentStyle.push("font-style: italic");
                    }
                    if (accentUnderline) {
                        accentStyle.push("text-decoration: underline");
                    }

                    const styleAttr = accentStyle.length > 0 ? ` style="${accentStyle.join("; ")}"` : "";
                    processedText = processedText.replace(/<accent>(.*?)<\/accent>/g, `<span${styleAttr}>$1</span>`);

                    return processedText;
                }

                // Build font style
                const font = data.font;
                const fontStyle = `
                    font-family: ${font?.family || "Open Sans"};
                    font-size: ${font?.size || 24}px;
                    color: ${font?.color || "#FFFFFF"};
                    font-weight: ${font?.weight || 400};
                    font-style: ${font?.italic ? "italic" : "normal"};
                `;

                // Process text with accent tags
                const processedText = processAccentTags(
                    data.text,
                    data.accentColor,
                    data.accentBold,
                    data.accentItalic,
                    data.accentUnderline
                );

                // Build media element
                let mediaHtml = "";
                const mediaScale = data.mediaScale || 100;

                if (data.mediaType === "image") {
                    let mediaSrc;
                    if (data.mediaUrl) {
                        mediaSrc = data.mediaUrl;
                    } else if (data.mediaResourceToken) {
                        mediaSrc = `/resource/${data.mediaResourceToken}`;
                    }
                    if (mediaSrc) {
                        mediaHtml = `<div class="firebot-overlay-alert-media" style="width: ${mediaScale}%;"><img src="${mediaSrc}" /></div>`;
                    }
                } else if (data.mediaType === "video") {
                    let videoSrc;
                    if (data.mediaUrl) {
                        videoSrc = data.mediaUrl;
                    } else if (data.mediaResourceToken) {
                        videoSrc = `/resource/${data.mediaResourceToken}`;
                    }
                    if (videoSrc) {
                        mediaHtml = `
                                <div class="firebot-overlay-alert-media" style="width: ${mediaScale}%;">
                                    <video autoplay>
                                        <source src="${videoSrc}" />
                                    </video>
                                </div>
                            `;
                    }
                }

                // Build text element
                let textHtml = "";
                if (processedText) {
                    textHtml = `<div class="firebot-overlay-alert-text" style="${fontStyle}">${processedText}</div>`;
                }

                // Calculate position and dimensions
                const position = data.position || { x: 0, y: 0, width: 1280, height: 720 };
                const containerX = position.x;
                const containerY = position.y;
                const containerWidth = position.width;
                const containerHeight = position.height;

                const alertElement = `
                    <div style="
                        width: ${containerWidth}px;
                        height: ${containerHeight}px;
                    ">
                        <div class="firebot-overlay-alert-container">
                            ${mediaHtml}
                            ${textHtml}
                        </div>
                    </div>
                `;

                const uniqueId = showElement(
                    alertElement,
                    {
                        position: "Custom",
                        customCoords: {
                            top: containerY,
                            left: containerX
                        }
                    },
                    {
                        enterAnimation: data.enterAnimation,
                        enterDuration: data.enterDuration,
                        inbetweenAnimation: data.inbetweenAnimation,
                        inbetweenDelay: data.inbetweenDelay,
                        inbetweenDuration: data.inbetweenDuration,
                        inbetweenRepeat: data.inbetweenRepeat,
                        exitAnimation: data.exitAnimation,
                        exitDuration: data.exitDuration,
                        totalDuration:
                            (typeof data.duration === "string" ? parseFloat(data.duration) : data.duration) * 1000
                    }
                );

                // Set video volume for local/clip videos
                if (data.mediaType === "video") {
                    setTimeout(() => {
                        // @ts-ignore
                        const videoEl = $(`#${uniqueId} video`)[0] as HTMLVideoElement;
                        if (videoEl && data.videoVolume != null) {
                            videoEl.volume = data.videoVolume / 10;
                        }
                    }, 100);
                }
            }
        }
    }
};

export = effect;