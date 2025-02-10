"use strict";

const logger = require("../../../logwrapper");
const frontendCommunicator = require("../../../common/frontend-communicator");
const tinycolor = require("tinycolor2");
const { api: hueApi, model } = require('node-hue-api');

const { LightState } = model;

/**@type {import('node-hue-api/dist/esm/api/Api').Api} */
let authenticatedApi = null;

async function connectHueBridge(hueUser) {

    // Create a new API instance that is authenticated with the new user we created
    try {
        authenticatedApi = await hueApi
            .createLocal(hueUser.ipAddress)
            .connect(hueUser.username);
        return true;
    } catch (err) {
        if (err) {
            if (err.getHueErrorType && err.getHueErrorType() === 101) {
                logger.error(`Hue error ${err.getHueErrorType()}`, err);
            } else {
                logger.error(`Unexpected Error: ${err.message}`, err);
            }
        }
        return false;
    }
}

async function deleteHueUser() {
    // The hue api does not allow deleting users. So, this will just show a popup to the user on where to go to delete Firebot access.

    frontendCommunicator.send(
        "error",
        "The Hue API does not allow Firebot to delete its access from the hue bridge. Please visit https://account.meethue.com/apps and click deactivate on Firebot."
    );
}

async function getAllHueLights() {
    if (authenticatedApi == null) {
        return Promise.resolve([]);
    }
    const lights = await authenticatedApi.lights.getAll();
    return lights.map(l => ({
        id: l.id,
        name: l.name,
        type: l.type,
        capabilities: l.capabilities
    }));
}

/**
 * @typedef {{
 *    on: boolean;
 *    reachable: boolean;
 * }} HueLightState
 */

/**
 * @param {string} lightId
 * @param {import("./effects/control-light").HueControlLightEffectData} controlOptions
 * @returns {Promise<boolean>}
 */
async function controlHueLight(lightId, controlOptions) {
    if (authenticatedApi == null) {
        return;
    }
    const light = await authenticatedApi.lights.getLight(lightId);

    if (light == null) {
        logger.error(`The light with id ${lightId} was not found`);
        return;
    }

    /**
     * @type {HueLightState}
     */
    const currentState = light.state;

    if (!currentState.reachable) {
        logger.error(`The light with id ${lightId} is not reachable`);
        return;
    }

    const updatedLightState = new LightState();
    const isOn = currentState.on;
    let willBeOn = currentState.on;
    if (controlOptions.updateActivated) {
        if (controlOptions.activationAction === "on") {
            updatedLightState.on();
            willBeOn = true;
        } else if (controlOptions.activationAction === "off") {
            updatedLightState.off();
            willBeOn = false;
        } else if (controlOptions.activationAction === "toggle") {
            willBeOn = !currentState.on;
            updatedLightState.on(willBeOn);
        }
    }

    if (isOn || willBeOn) {
        if (controlOptions.updateBrightness && controlOptions.brightnessPercentage != null) {
            const brightnessValue = parseFloat(controlOptions.brightnessPercentage?.replace("%", ""));
            if (!isNaN(brightnessValue) && brightnessValue >= 0 && brightnessValue <= 100) {
                updatedLightState.brightness(brightnessValue);
            }
        }

        if (controlOptions.updateColor && controlOptions.color != null) {
            const color = tinycolor(controlOptions.color).setAlpha(1).toRgb();
            updatedLightState.rgb(color.r, color.g, color.b);
        }

        if (controlOptions.triggerAlert) {
            if (controlOptions.alertType === "long") {
                updatedLightState.alertLong();
            } else if (controlOptions.alertType === "short") {
                updatedLightState.alertShort();
            } else if (controlOptions.alertType === "disable") {
                updatedLightState.alertNone();
            }
        }

        if (controlOptions.triggerEffectAnimation) {
            if (controlOptions.effectAnimationType === "colorloop") {
                updatedLightState.effectColorLoop();
            } else if (controlOptions.effectType === "none") {
                updatedLightState.effectNone();
            }
        }
    }

    if (controlOptions.transitionType === "instant") {
        updatedLightState.transitionInstant();
    } else if (controlOptions.transitionType === "fast") {
        updatedLightState.transitionFast();
    } else if (controlOptions.transitionType === "slow") {
        updatedLightState.transitionSlow();
    } else if (controlOptions.transitionType === "custom" && controlOptions.customTransitionSecs != null) {
        const transitionTime = parseFloat(controlOptions.customTransitionSecs);
        if (!isNaN(transitionTime) && transitionTime > 0) {
            updatedLightState.transitionInMillis(transitionTime * 1000);
        }
    } else {
        updatedLightState.transitionDefault();
    }

    const success = await authenticatedApi.lights.setLightState(lightId, updatedLightState);

    return success;
}

async function getAllHueScenes() {
    if (authenticatedApi == null) {
        return Promise.resolve([]);
    }
    const scenes = await authenticatedApi.scenes.getAll();
    return scenes.map(s => ({
        id: s.id,
        name: s.name
    }));
}

async function setHueScene(sceneId) {
    if (authenticatedApi == null) {
        return;
    }
    const activated = await authenticatedApi.scenes.activateScene(sceneId);
    logger.debug(`The hue scene ${sceneId} was successfully activated? ${activated}`);
}

frontendCommunicator.onAsync("getAllHueScenes", () => {
    return getAllHueScenes();
});

frontendCommunicator.onAsync("getAllHueLights", () => {
    return getAllHueLights();
});

exports.connectHueBridge = connectHueBridge;
exports.deleteHueUser = deleteHueUser;
exports.setHueScene = setHueScene;
exports.controlHueLight = controlHueLight;
