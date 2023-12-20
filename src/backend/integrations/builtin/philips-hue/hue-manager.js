"use strict";

const logger = require("../../../logwrapper");
const frontEndCommunicator = require("../../../common/frontend-communicator");

const hueApi = require('node-hue-api').v3.api;

/**@type {import('node-hue-api/lib/api/Api')} */
let authenticatedApi = null;

async function connectHueBridge(hueUser) {

    // Create a new API instance that is authenticated with the new user we created
    try {
        authenticatedApi = await hueApi.createLocal(hueUser.ipAddress).connect(hueUser.username);
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

    renderWindow.webContents.send(
        "error",
        "The Hue API does not allow Firebot to delete it's access from the hue bridge. Please visit https://account.meethue.com/apps and click deactivate on Firebot."
    );
}

function getAllHueScenes() {
    if (authenticatedApi == null) {
        return Promise.resolve(null);
    }
    return authenticatedApi.scenes.getAll();
}

async function setHueScene(sceneId) {
    if (authenticatedApi == null) {
        return null;
    }
    const activated = await authenticatedApi.scenes.activateScene(sceneId);
    logger.debug(`The hue scene was successfully activated? ${activated}`);
}

// send the scenes to the front end when requested
frontEndCommunicator.onAsync("getAllHueScenes", () => {
    return getAllHueScenes();
});

exports.connectHueBridge = connectHueBridge;
exports.deleteHueUser = deleteHueUser;
exports.getAllHueScenes = getAllHueScenes;
exports.setHueScene = setHueScene;
