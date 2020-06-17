"use strict";

const logger = require("../../../logwrapper");
const v3 = require('node-hue-api').v3,
    hueApi = v3.api;

class HueHandler {
    constructor() {
        this.authenticatedApi = [];
    }

    async connectHueBridge(integrationData) {
        let hueSettings = integrationData.settings;
        let hueUser = hueSettings.user;

        // Create a new API instance that is authenticated with the new user we created
        try {
            this.authenticatedApi = await hueApi.createLocal(hueUser.ipAddress).connect(hueUser.username);
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

    async deleteHueUser(integrationData) {
        const promises = [];

        if (this.authenticatedApi == null) {
            await this.connectHueBridge(integrationData);
        }

        this.authenticatedApi.users.getAll()
            .then(async allUsers => {
                allUsers.forEach(async user => {
                    if (user.name === "Firebot#Firebot-Hue") {
                        try {
                            console.log(user);
                            promises.push(this.authenticatedApi.users.deleteUser(user.username));
                        } catch (err) {
                            logger.error(err);
                        }
                    }
                });
            });

        const deletionResults = await Promise.all(promises);
        console.log(JSON.stringify(deletionResults));
    }

    async getAllHueScenes() {
        let scenes = await this.authenticatedApi.scenes.getAll();
        return scenes;
    }

    async activateHueScene(sceneId) {
        let activated = await this.authenticatedApi.scenes.activateScene(sceneId);
        logger.debug(`The hue scene was successfully activated? ${activated}`);
    }
}

const manager = new HueHandler();
module.exports = manager;
