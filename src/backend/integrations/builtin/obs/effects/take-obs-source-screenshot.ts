import { EffectType } from "../../../../../types/effects";
import {CustomEmbed, EmbedType} from "../../../../../types/discord";
import {getCurrentSceneName, OBSSource, OBSSourceScreenshotSettings, takeSourceScreenshot} from "../obs-remote";
import logger from "../../../../logwrapper";
import * as screenshotHelpers from "../../../../common/screenshot-helpers";

export const TakeOBSSourceScreenshotEffectType: EffectType<{
    source: string;
    /**
     * @deprecated No longer used as of 5.60
     */
    format?: string;
    file: string;
    overwriteExisting?: boolean;
    saveLocally?: boolean;
    fileNamePattern?: string;
    folderPath?: string;
    showInOverlay?: boolean;
    postInDiscord?: boolean;
    discordChannelId?: string;
    message?: string;
    height: number;
    width: number;
    quality: number;
    useActiveScene: boolean;
    includeEmbed?: boolean;
    embedType?: EmbedType;
    embedColor?: string;
    customEmbed: CustomEmbed;
} & screenshotHelpers.ScreenshotEffectData> = {
    definition: {
        id: "firebot:obs-source-screenshot",
        name: "Take OBS Source Screenshot",
        description: "Takes a screenshot of an OBS Source and saves it.",
        icon: "fad fa-camera-retro",
        categories: ["common"],
        outputs: [
            {
                label: "Screenshot Data URL",
                description: "The base64 data URL for the screenshot.",
                defaultName: "screenshotDataUrl"
            }
        ]
    },
    optionsTemplate: `
    <div>
        <eos-container header="OBS Source">
            <div>
                <button class="btn btn-link" ng-click="getSources()">Refresh Source Data</button>
            </div>
            <ui-select ng-if="sources != null" ng-hide="effect.useActiveScene" ng-model="effect.source" theme="bootstrap">
                    <ui-select-match>{{$select.selected.name}} ({{$select.selected.type}})</ui-select-match>
                    <ui-select-choices repeat="item.name as item in sources | filter: $select.search">
                        <div ng-bind-html="item.name | highlight: $select.search"></div>
                        <small ng-bind-html="item.type | highlight: $select.search"></small>
                    </ui-select-choices>
                </ui-select>

                <div ng-if="sources == null" ng-hide="effect.useActiveScene" class="muted">
                    No sources found. {{ isObsConfigured ? "Is OBS running?" : "Have you configured the OBS integration?" }}
                </div>

                <div style="padding-top:20px">
                <label class="control-fb control--checkbox"> Use Active Scene <tooltip text="'Take a screenshot of the active scene.'"></tooltip>
                    <input type="checkbox" ng-model="effect.useActiveScene">
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>

        <div class="effect-setting-container setting-padtop">
            <div class="effect-specific-title"><h4>Image Settings <span class="muted">(Optional)</span></h4></div>
            <div class="effect-setting-content">
                <div class="input-group">
                    <span class="input-group-addon">Quality</span>
                    <input
                        type="number"
                        class="form-control"
                        aria-describeby="image-compression-setting-type"
                        ng-model="effect.quality"
                        uib-tooltip="100 is uncompressed, 0 is most compressed."
                        tooltip-append-to-body="true"
                        aria-label="Compression Setting"
                        placeholder="100"
                        min="-1"
                        max="100"
                        style="width: 100px;">
                    <span class="input-group-addon">Width</span>
                    <input
                        type="number"
                        class="form-control"
                        aria-describeby="image-width-setting-type"
                        ng-model="effect.width"
                        uib-tooltip="Amount of pixels to scale the width to. Uses the source width if left empty"
                        tooltip-append-to-body="true"
                        placeholder="px">
                    <span class="input-group-addon">Height</span>
                    <input
                        type="number"
                        class="form-control"
                        aria-describeby="image-height-setting-type"
                        ng-model="effect.height"
                        uib-tooltip="Amount of pixels to scale the height to. Uses the source height if left empty"
                        tooltip-append-to-body="true"
                        placeholder="px">
                    </div>
                </div>
            </div>
        </div>
        <screenshot-effect-options effect="effect"></screenshot-effect-options>
    <div>
  `,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    optionsController: ($scope: any, backendCommunicator: any, $q: any) => {
        $scope.isObsConfigured = false;

        $scope.getSources = () => {
            $scope.isObsConfigured = backendCommunicator.fireEventSync("obs-is-configured");

            $q.when(
                backendCommunicator.fireEventAsync("obs-get-all-sources")
            ).then(
                (sources: OBSSource[]) => $scope.sources = sources
            );
        };

        $scope.getSources();
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        const rgbRegexp = /^#?[0-9a-f]{6}$/ig;
        if (!effect.useActiveScene && effect.source == null) {
            errors.push("You need to select a source!");
        }
        if (!(effect.saveLocally || effect.overwriteExisting || effect.postInDiscord || effect.showInOverlay)) {
            errors.push("You need to select an output option!");
        }
        if (effect.saveLocally && !effect.folderPath) {
            errors.push("You need to select a folder path!");
        }
        if (effect.overwriteExisting && !effect.file) {
            errors.push("You need to select a file!");
        }
        if (effect.postInDiscord && !effect.discordChannelId) {
            errors.push("You need to select a discord channel!");
        }
        if (effect.postInDiscord && effect.embedType && !rgbRegexp.test(effect.embedColor)) {
            errors.push("Discord Embed Color must be in RGB format (#0066FF)");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect }) => {
        // Compatibility for effects made before 5.60
        const isLegacyEffect = !(effect.saveLocally || effect.overwriteExisting || effect.postInDiscord || effect.showInOverlay) && effect.file;
        if (isLegacyEffect) {
            effect.overwriteExisting = true;
        }

        const screenshotSettings: OBSSourceScreenshotSettings = {
            sourceName: effect.useActiveScene ? getCurrentSceneName() : effect.source,
            imageFormat: isLegacyEffect && effect.format ? effect.format : "png",
            imageHeight: effect.height,
            imageWidth: effect.width,
            imageCompressionQuality: effect.quality
        };

        const screenshotDataUrl = await takeSourceScreenshot(screenshotSettings);

        if (screenshotDataUrl == null) {
            logger.error("Source screenshot is null, ignoring.");
            return {
                success: false,
                outputs: {
                    screenshotDataUrl: ""
                }
            };
        }

        const base64ImageData = screenshotDataUrl.split("base64,")[1];
        if (effect.saveLocally) {
            await screenshotHelpers.saveScreenshotToFolder(base64ImageData, effect.folderPath, effect.fileNamePattern);
        }

        if (effect.overwriteExisting) {
            await screenshotHelpers.saveScreenshotToFile(base64ImageData, effect.file);
        }

        if (effect.postInDiscord) {
            switch (effect.embedType) {
                case "channel":
                case "custom":
                    await screenshotHelpers.sendEmbedToDiscord(base64ImageData, effect.embedType, effect.message, effect.customEmbed, effect.discordChannelId, effect.embedColor);
                    break;
                case "stream":
                case undefined:
                    await screenshotHelpers.sendScreenshotToDiscord(base64ImageData, effect.message, effect.discordChannelId, effect.embedColor);
                    break;
            }
        }

        if (effect.showInOverlay) {
            screenshotHelpers.sendScreenshotToOverlay(screenshotDataUrl, effect);
        }

        return {
            success: true,
            outputs: {
                screenshotDataUrl
            }
        };
    }
};
