"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const webServer = require("../../../server/httpServer");
const fs = require('fs-extra');
const logger = require("../../logwrapper");
const path = require("path");
const frontendCommunicator = require("../../common/frontend-communicator");
const { EffectCategory } = require('../../../shared/effect-constants');
const { wait } = require("../../utility");

/**
 * The Play Sound effect
 */
const playSound = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:playsound",
        name: "Play Sound",
        description: "Plays a sound effect",
        icon: "fad fa-waveform",
        categories: [EffectCategory.COMMON],
        dependencies: []
    },
    /**
   * Global settings that will be available in the Settings tab
   */
    globalSettings: {},
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `
    <eos-container header="Type">
        <div class="controls-fb-inline" style="padding-bottom: 5px;">
            <label class="control-fb control--radio">Local file
                <input type="radio" ng-model="effect.soundType" value="local"/>
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--radio">Random from folder
                <input type="radio" ng-model="effect.soundType" value="folderRandom"/>
                <div class="control__indicator"></div>
            </label>
        </div>
    </eos-container>

    <div ng-hide="effect.soundType == null">
        <eos-container header="Sound">
            <div ng-if="effect.soundType === 'folderRandom'">
                <file-chooser model="effect.folder" options="{ directoryOnly: true, filters: [], title: 'Select Sound Folder'}"></file-chooser>
            </div>

            <div ng-if="effect.soundType === 'local'">
                <div style="margin-bottom: 10px">
                    <file-chooser model="effect.filepath" options="{ filters: [ {name: 'Audio', extensions: ['mp3', 'ogg', 'wav', 'flac']} ]}" on-update="soundFileUpdated(filepath)"></file-chooser>
                </div>
                <div>
                    <sound-player path="effect.filepath" volume="effect.volume" output-device="effect.audioOutputDevice"></sound-player>
                </div>
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
    /**
   * The controller for the front end Options
   */
    optionsController: ($scope, listenerService) => {
        if ($scope.effect.soundType == null) {
            $scope.effect.soundType = "local";
        }

        if ($scope.effect.volume == null) {
            $scope.effect.volume = 5;
        }
    },
    /**
   * When the effect is saved
   */
    optionsValidator: effect => {
        let errors = [];
        console.log(effect);

        if (effect.soundType === "local" || effect.soundType == null) {
            if (effect.filepath == null || effect.filepath.length < 1) {
                errors.push("Please select a sound file.");
            }
        } else {
            if (effect.folder == null || effect.folder.length < 1) {
                errors.push("Please select a sound folder.");
            }
        }


        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async event => {
        let effect = event.effect;

        // Fallback 6-16-20
        if (effect.soundType == null) {
            effect.soundType = "local";
        }

        let data = {
            filepath: effect.filepath,
            volume: effect.volume,
            overlayInstance: effect.overlayInstance
        };

        // Get random sound
        if (effect.soundType === "folderRandom") {
            let files = [];
            try {
                files = await fs.readdir(effect.folder);
            } catch (err) {
                logger.warn("Unable to read sound folder", err);
            }

            let filteredFiles = files.filter(i => (/\.(mp3|ogg|wav)$/i).test(i));
            let chosenFile = filteredFiles[Math.floor(Math.random() * filteredFiles.length)];

            if (filteredFiles.length === 0) {
                logger.error('No sounds were found in the select sound folder.');
            }

            let fullFilePath = path.join(effect.folder, chosenFile);
            data.filepath = fullFilePath;
        }

        // Set output device.
        let selectedOutputDevice = effect.audioOutputDevice;
        if (selectedOutputDevice == null || selectedOutputDevice.label === "App Default") {
            selectedOutputDevice = settings.getAudioOutputDevice();
        }
        data.audioOutputDevice = selectedOutputDevice;

        // Generate token if going to overlay, otherwise send to gui.
        if (selectedOutputDevice.deviceId === "overlay") {
            let resourceToken = resourceTokenManager.storeResourcePath(
                data.filepath,
                30
            );
            data.resourceToken = resourceToken;

            // send event to the overlay
            webServer.sendToOverlay("sound", data);
        } else {
            // Send data back to media.js in the gui.
            renderWindow.webContents.send("playsound", data);
        }

        if (effect.waitForSound) {
            try {
                const duration = await frontendCommunicator.fireEventAsync("getSoundDuration", {
                    path: data.filepath
                });
                const durationInMils = (Math.round(duration) || 0) * 1000;
                await wait(durationInMils);
                return true;
            } catch (error) {
                return true;
            }
        }
        return true;
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
            onOverlayEvent: event => {
                let data = event;
                let token = encodeURIComponent(data.resourceToken);
                let resourcePath = `http://${
                    window.location.hostname
                }:7472/resource/${token}`;

                // Get time in milliseconds to use as class name.
                let d = new Date();
                let uuid = d.getTime().toString();

                let filepath = data.filepath.toLowerCase();
                let mediaType;
                if (filepath.endsWith("mp3")) {
                    mediaType = "audio/mpeg";
                } else if (filepath.endsWith("ogg")) {
                    mediaType = "audio/ogg";
                } else if (filepath.endsWith("wav")) {
                    mediaType = "audio/wav";
                }

                let audioElement = `<audio id="${uuid}" src="${resourcePath}" type="${mediaType}"></audio>`;

                // Throw audio element on page.
                $("#wrapper").append(audioElement);

                let audio = document.getElementById(uuid);
                audio.volume = parseFloat(data.volume) / 10;

                audio.oncanplay = () => audio.play();

                audio.onended = () => {
                    $("#" + uuid).remove();
                };
            }
        }
    }
};

module.exports = playSound;
