"use strict";
const logger = require("../../../logwrapper");
const v3 = require('node-hue-api').v3,
    discovery = v3.discovery,
    hueApi = v3.api;

// Core API
let authenticatedApi;

exports.connectHueBridge = async (integrationData) => {
    let hueSettings = integrationData.settings;
    let hueUser = hueSettings.user;

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
};

exports.deleteHueUser = async (integrationData) => {
    const promises = [];

    if (authenticatedApi == null) {
        await this.connectHueBridge(integrationData);
    }

    await authenticatedApi.users.getAll()
        .then(async allUsers => {
            allUsers.forEach(user => {
                if (user.name === "Firebot#Firebot-Hue" && user.username != null) {
                    console.log(`Deleting ${user.name} (${user.username})`);
                    promises.push(authenticatedApi.users.deleteUser(user.username));
                }
            });
        });

    const deletionResults = await Promise.all(promises);
    console.log(JSON.stringify(deletionResults));
};