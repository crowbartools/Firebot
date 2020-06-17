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
        if (err.getHueErrorType() === 101) {
            logger.error('Hue error ' + err.getHueErrorType());
        } else {
            logger.error(`Unexpected Error: ${err.message}`);
        }
        return false;
    }
}

async function deleteHueUser(hueUser) {
    if (authenticatedApi == null) {
        const successfullyConnected = await connectHueBridge(hueUser);
        if (!successfullyConnected) {
            return;
        }
    }

    /**@type {Promise<any>[]}*/
    const promises = [];

    const users = authenticatedApi.users.getAll();
    for (const user of users) {
        if (user.name === "Firebot#Firebot-Hue") {
            try {
                console.log(user);
                promises.push(authenticatedApi.users.deleteUser(user.username));
            } catch (err) {
                logger.error(err);
            }
        }
    }

    const deletionResults = await Promise.all(promises);
    console.log(JSON.stringify(deletionResults));
}

function getAllHueScenes() {
    if (authenticatedApi == null) {
        return Promise.resolve(null);
    }
    return authenticatedApi.scenes.getAll();
}

async function activateHueScene(sceneId) {
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
exports.activateHueScene = activateHueScene;
