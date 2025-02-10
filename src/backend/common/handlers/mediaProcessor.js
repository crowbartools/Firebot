"use strict";

const { SettingsManager } = require("../settings-manager");
const { ResourceTokenManager } = require("../../resource-token-manager");
const util = require("../../utility");
const logger = require("../../logwrapper");
const webServer = require("../../../server/http-server-manager");
const frontendCommunicator = require("../frontend-communicator");

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPresetLocation() {
    const presetPositions = [
        "Top Left",
        "Top Middle",
        "Top Right",
        "Middle Left",
        "Middle",
        "Middle Right",
        "Bottom Left",
        "Bottom Middle",
        "Bottom Right"
    ];

    const randomIndex = getRandomInt(0, presetPositions.length - 1);
    return presetPositions[randomIndex];
}

// Sound Processor
// This takes info passed from the controls router and sends it back to the render process in order to play media.
function soundProcessor(effect) {
    const data = {
        filepath: effect.file,
        volume: effect.volume
    };

    let selectedOutputDevice = effect.audioOutputDevice;
    if (
        selectedOutputDevice == null ||
    selectedOutputDevice.label === "App Default"
    ) {
        selectedOutputDevice = SettingsManager.getSetting("AudioOutputDevice");
    }
    data.audioOutputDevice = selectedOutputDevice;

    if (selectedOutputDevice.deviceId === "overlay") {
        const resourceToken = ResourceTokenManager.storeResourcePath(effect.file, 30);
        data.resourceToken = resourceToken;
    }

    if (SettingsManager.getSetting("UseOverlayInstances")) {
        if (effect.overlayInstance != null) {
            if (SettingsManager.getSetting("OverlayInstances").includes(effect.overlayInstance)) {
                data.overlayInstance = effect.overlayInstance;
            }
        }
    }

    // Send data back to media.js in the gui.
    frontendCommunicator.send("playsound", data);
}

// Image Processor
async function imageProcessor(effect, trigger) {

    logger.debug("processing image effect...");

    // Send data back to media.js in the gui.

    let position = effect.position;
    if (position === "Random") {
        position = getRandomPresetLocation();
    }

    const data = {
        "filepath": effect.file,
        "url": effect.url,
        "imageType": effect.imageType,
        "imagePosition": position,
        "imageHeight": effect.height,
        "imageWidth": effect.width,
        "imageDuration": effect.length,
        "enterAnimation": effect.enterAnimation,
        "exitAnimation": effect.exitAnimation,
        "enterDuration": effect.enterDuration,
        "exitDuration": effect.exitDuration,
        "inbetweenAnimation": effect.inbetweenAnimation,
        "inbetweenDelay": effect.inbetweenDelay,
        "inbetweenDuration": effect.inbetweenDuration,
        "inbetweenRepeat": effect.inbetweenRepeat,
        "customCoords": effect.customCoords
    };

    if (SettingsManager.getSetting("UseOverlayInstances")) {
        if (effect.overlayInstance != null) {
            if (SettingsManager.getSetting("OverlayInstances").includes(effect.overlayInstance)) {
                data.overlayInstance = effect.overlayInstance;
            }
        }
    }

    if (effect.imageType == null) {
        effect.imageType = "local";
    }

    if (effect.imageType === "local") {
        const resourceToken = ResourceTokenManager.storeResourcePath(
            effect.file,
            effect.length
        );
        data.resourceToken = resourceToken;
    } else {
        logger.debug("Populating show image effect url with variables");
        data.url = await util.populateStringWithTriggerData(data.url, trigger);
    }

    webServer.sendToOverlay("image", data);
}

// Video Processor
function videoProcessor(effect) {
    let position = effect.position;
    if (position === "Random") {
        position = getRandomPresetLocation();
    }

    // Send data back to media.js in the gui.
    const data = {
        "videoType": effect.videoType,
        "filepath": effect.file,
        "youtubeId": effect.youtube,
        "videoPosition": position,
        "videoHeight": effect.height,
        "videoWidth": effect.width,
        "videoDuration": effect.length,
        "videoVolume": effect.volume,
        "videoStarttime": effect.starttime,
        "enterAnimation": effect.enterAnimation,
        "exitAnimation": effect.exitAnimation,
        "enterDuration": effect.enterDuration,
        "exitDuration": effect.exitDuration,
        inbetweenAnimation: effect.inbetweenAnimation,
        inbetweenDelay: effect.inbetweenDelay,
        inbetweenDuration: effect.inbetweenDuration,
        "inbetweenRepeat": effect.inbetweenRepeat,
        "customCoords": effect.customCoords,
        "loop": effect.loop === true
    };

    if (SettingsManager.getSetting("UseOverlayInstances")) {
        if (effect.overlayInstance != null) {
            if (SettingsManager.getSetting("OverlayInstances").includes(effect.overlayInstance)) {
                data.overlayInstance = effect.overlayInstance;
            }
        }
    }

    const resourceToken = ResourceTokenManager.storeResourcePath(
        effect.file,
        effect.length
    );
    data.resourceToken = resourceToken;

    webServer.sendToOverlay("video", data);
}

// Display Text Processor
async function showText(effect, trigger) {
    //data transfer object
    const dto = {
        text: effect.text,
        enterAnimation: effect.enterAnimation,
        exitAnimation: effect.exitAnimation,
        enterDuration: effect.enterDuration,
        exitDuration: effect.exitDuration,
        inbetweenAnimation: effect.inbetweenAnimation,
        inbetweenDelay: effect.inbetweenDelay,
        inbetweenDuration: effect.inbetweenDuration,
        inbetweenRepeat: effect.inbetweenRepeat,
        customCoords: effect.customCoords,
        position: effect.position,
        duration: effect.duration,
        height: effect.height,
        width: effect.width,
        justify: effect.justify,
        dontWrap: effect.dontWrap,
        overlayInstance: effect.overlayInstance
    };

    logger.debug("Populating show text effect text with variables");
    dto.text = await util.populateStringWithTriggerData(dto.text, trigger);

    const position = dto.position;
    if (position === "Random") {
        logger.debug("Getting random preset location");
        dto.position = getRandomPresetLocation();
    }

    if (SettingsManager.getSetting("UseOverlayInstances")) {
        if (dto.overlayInstance != null) {
            //reset overlay if it doesnt exist
            if (!SettingsManager.getSetting("OverlayInstances").includes(dto.overlayInstance)) {
                dto.overlayInstance = null;
            }
        }
    }

    // Ensure defaults
    if (dto.duration <= 0) {
        logger.debug("Effect duration is less tha 0, resetting duration to 5 sec");
        dto.duration = 5;
    }

    if (dto.height == null || dto.height < 1) {
        logger.debug("Setting default height");
        dto.height = 200;
    }

    if (dto.width == null || dto.width < 1) {
        logger.debug("Setting default width");
        dto.width = 400;
    }

    if (dto.position === "" || dto.position == null) {
        logger.debug("Setting default overlay position");
        dto.position = "Middle";
    }

    if (dto.justify == null) {
        dto.justify = "center";
    }

    if (dto.dontWrap == null) {
        dto.dontWrap = false;
    }

    webServer.sendToOverlay("text", dto);
}

// Export Functions
exports.sound = soundProcessor;
exports.image = imageProcessor;
exports.video = videoProcessor;
exports.text = showText;
exports.randomLocation = getRandomPresetLocation;