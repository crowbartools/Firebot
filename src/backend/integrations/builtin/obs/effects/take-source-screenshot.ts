import { Firebot } from "@crowbartools/firebot-custom-scripts-types";
import { saveSourceScreenshot, getSourceScreenshot, OBSSource } from "../obs-remote";
import { sendDiscordMessage } from "../../discord/discord-message-sender";
const logger = require("../../../../logwrapper");

type EffectProperties = {
    imageFile: string;
    imageWidth: number;
    imageHeight: number;
    imageCompression: number;
    channelId: string;
    sourceName: string;
    imageFormat: string;
    imageTarget: string;
}

type Scope = {
    effect: EffectProperties;
    [x: string]: any;
}

export const TakeSourceScreenshotEffectType: Firebot.EffectType<EffectProperties> = {
    definition: {
        id: "obs:take-source-screenshot",
        name: "OBS Take Source Screenshot",
        description: "Take a screenshot of an OBS source.",
        icon: "fad fa-camera-retro",
        categories: ["common"],
    },
    optionsTemplate: `
    <eos-container header="OBS Source">
        <div ng-if="sources != null" class="btn-group" uib-dropdown>
            <button type="button" class="btn btn-default" uib-dropdown-toggle>
              {{effect.sourceName}} <span class="caret"></span>
            </button>
            <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                <li role="menuitem" ng-repeat="source in sources" ng-click="selectSource(source.name)">
                    <a href>{{source.name}}</a>
                </li>
                <li role="menuitem" ng-show="sources.length < 1" class="muted">
                    <a>No sources found.</a>
                </li>
            </ul>
        </div>
        <div ng-if="sources == null" class="muted">
            No sources found. Is OBS running?
        </div>
        <p>
            <button class="btn btn-link" ng-click="getSources()">Refresh Source Data</button>
        </p>
    </eos-container>
  <div ng-if="sources != null && effect.sourceName != null">

    <div class="effect-setting-container">
    <div class="effect-specific-title"><h4>Image Target</h4></div>
    <div class="effect-setting-content">
        <div class="input-group">
        <div class="controls-fb-inline" style="padding-bottom: 5px;">
            <label class="control-fb control--radio">Save File
                <input type="radio" ng-model="effect.imageTarget" value="save" ng-change="imageTargetUpdated()"/>
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--radio">Send To Discord
                <input type="radio" ng-model="effect.imageTarget" value="discord" ng-change="imageTargetUpdated()"/>
                <div class="control__indicator"></div>
            </label>
        </div>
    </div>
    </div>
    
    <div class="effect-setting-container">
    <div class="effect-specific-title"><h4>Image Settings</h4></div>
    <div class="effect-setting-content">
        <div class="input-group">
            <span class="input-group-addon">Image Format</span>
            <div class="btn-group" uib-dropdown>
        <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
            {{effect.imageFormat}} <span class="caret"></span>
        </button>
        <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
            <li role="menuitem" ng-if="effect.imageTarget == 'save'" ng-click="effect.imageFormat = 'bmp'"><a href>bmp</a></li>
            <li role="menuitem" ng-click="effect.imageFormat = 'jpeg'"><a href>jpeg</a></li>
            <li role="menuitem" ng-click="effect.imageFormat = 'jpg'"><a href>jpg</a></li>
            <li role="menuitem" ng-if="effect.imageTarget == 'save'" ng-click="effect.imageFormat = 'pbm'"><a href>pbm</a></li>
            <li role="menuitem" ng-if="effect.imageTarget == 'save'" ng-click="effect.imageFormat = 'pgm'"><a href>pgm</a></li>
            <li role="menuitem" ng-click="effect.imageFormat = 'png'"><a href>png</a></li>
            <li role="menuitem" ng-if="effect.imageTarget == 'save'" ng-click="effect.imageFormat = 'ppm'"><a href>ppm</a></li>
            <li role="menuitem" ng-if="effect.imageTarget == 'save'" ng-click="effect.imageFormat = 'xbm'"><a href>xbm</a></li>
            <li role="menuitem" ng-if="effect.imageTarget == 'save'" ng-click="effect.imageFormat = 'xpm'"><a href>xpm</a></li>
        </ul>
    </div>
        <span class="input-group-addon">Image Compression</span>
        <input
            type="number"
            class="form-control"
            aria-describeby="image-compression-setting-type"
            ng-model="effect.imageCompression"
            uib-tooltip="100 is uncompressed, 0 is most compressed."
            aria-label="Compression Setting"
            tooltip-append-to-body="true"
            placeholder="100"
            min="-1"
            max="100">
    </div>
    </div>
    <div ng-if="effect.imageTarget == 'save'">
    <div class="effect-setting-container setting-padtop">
    <div class="effect-specific-title"><h4>Image File</h4></div>
    <div class="effect-setting-content">
        <div class="input-group">
        <span class="input-group-addon">Image File</span>
        <file-chooser model="effect.imageFile" options="{ filters: [ {name: 'All Files', extensions: ['*']} ]}"></file-chooser>
        </div>
    </div>
    </div>
    </div>
    <eos-container class="setting-padtop" ng-if="effect.imageTarget == 'discord'" header="Discord Channel">
        <dropdown-select options="channelOptions" selected="effect.channelId"></dropdown-select>
    </eos-container>
    <div class="effect-setting-container setting-padtop">
    <div class="effect-specific-title"><h4>Dimensions</h4></div>
    <div class="effect-setting-content">
        <div class="input-group">
            <span class="input-group-addon">Width</span>
            <input
                type="number"
                class="form-control"
                aria-describeby="image-width-setting-type"
                ng-model="effect.imageWidth"
                placeholder="px">
            <span class="input-group-addon">Height</span>
            <input
                type="number"
                class="form-control"
                aria-describeby="image-height-setting-type"
                ng-model="effect.imageHeight"
                placeholder="px">
        </div>
    </div>
    </div>
  <div ng-if="effect.imageTarget == 'save'" class="effect-info alert alert-info">
    <b>Warning!</b> If you're running Firebot on another computer, images are saved on the machine running OBS.
  </div>
  <div ng-if="effect.imageTarget == 'discord'" class="effect-info alert alert-info">
    <b>Warning!</b> Images are subject to Discord's size limit. By default, this is 8 MB, and may change depending on your server's
                 <a ng-click="openLink('https://support.discord.com/hc/en-us/articles/360028038352-Server-Boosting-FAQ-#h_419c3bd5-addd-4989-b7cf-c7957ef92583')"
                    class="clickable"
                    uib-tooltip="Discord Boost Tiers"
                    aria-label="Discord Boost Tiers"
                    tooltip-append-to-body="true">
                    Discord Boost Tier</a>.
  </div>
  </div>
  `,
    optionsController: ($scope : Scope, backendCommunicator: any, $q: any, $rootScope : any) => {
        $scope.openLink = $rootScope.openLinkExternally;
        if ($scope.effect.imageTarget == null) {
            $scope.effect.imageTarget = "save";
        }
        if ($scope.effect.imageFormat == null){
            $scope.effect.imageFormat = 'png';
        }
        $scope.sources = [];
        $scope.selectSource = (sourceName) => {
            $scope.effect.sourceName = sourceName;
        };
        $scope.getSources = () => {
            $q.when(backendCommunicator.fireEventAsync("obs-get-all-sources")).then(
                (sources : Array<OBSSource>) => {
                    $scope.sources = sources ?? [];
                }
            );
        };
        $scope.getChannels = () => {
            $scope.channelOptions = {};
            $scope.hasChannels = false;
            $q.when(backendCommunicator.fireEventAsync("getDiscordChannels")).then(channels => {
                if (channels && channels.length > 0) {
                    const newChannels = {};
                    for (const channel of channels) {
                        newChannels[channel.id] = channel.name;
                    }
                    if ($scope.effect.channelId == null ||
                        newChannels[$scope.effect.channelId] == null) {
                        $scope.effect.channelId = channels[0].id;
                    }
                    $scope.channelOptions = newChannels;
                    $scope.hasChannels = true;
                }
            });
        }
        $scope.imageTargetUpdated = () => {
            if ($scope.effect.imageTarget === "discord") {
                const discordAllowed = ["png", "jpg", "jpeg"]
                if (!discordAllowed.some(da => $scope.effect.imageFormat == da)) {
                    $scope.effect.imageFormat = "png";
                }
            }
        };
        $scope.getChannels();
        $scope.getSources();
    },
    optionsValidator: (effect) => {
        let issues = [];
        if (effect.sourceName == null) {
            issues.push("Please select a source.");
        }
        if (effect.imageTarget === "save" && effect.imageFile == null) {
            issues.push("Please select a file.");
        }
        if (effect.imageWidth == null) {
            issues.push("Please set the image width.");
        }
        if (effect.imageHeight == null) {
            issues.push("Please set the image height.");
        }
        if (effect.imageCompression == null) {
            issues.push("Please set the image compression.");
        }
        return issues;
    },
    onTriggerEvent: async ({ effect }) => {
        if (effect.imageTarget === "save") {
            await saveSourceScreenshot(effect.sourceName, effect.imageFormat, effect.imageFile, effect.imageWidth, effect.imageHeight, effect.imageCompression);
            return true;
        }
        let raw = await getSourceScreenshot(effect.sourceName, effect.imageFormat, effect.imageWidth, effect.imageHeight, effect.imageCompression);
        let file = {
            "file": Buffer.from(raw.split("base64,")[1], "base64"),
            "name": "image."+effect.imageFormat,
            "description": "screenshot"
        };
        await sendDiscordMessage(effect.channelId, null, null, [file]);
        return true;
    },
};
