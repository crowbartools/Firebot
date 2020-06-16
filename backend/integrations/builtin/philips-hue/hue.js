"use strict";
const EventEmitter = require("events");
const logger = require("../../../logwrapper");
const v3 = require('node-hue-api').v3,
    discovery = v3.discovery,
    hueApi = v3.api;
const appName = 'Firebot';
const deviceName = 'Firebot-Hue';

const integrationDefinition = {
    id: "hue",
    name: "Philips Hue",
    description: "Allows users to run hue specific effects. Press the link button on your hue bridge, then press link.",
    linkType: "other",
    connectionToggle: false
};

class HueIntegration extends EventEmitter {
    constructor() {
        super();
        this.connected = false;
    }
    init() {
        // Register hue specific events and variables here.
    }
    connect(integrationData) {
        // TODO: Auth with username and key we've saved. Maybe separate this out into it's own file.

        // Create a new API instance that is authenticated with the new user we created
        //const authenticatedApi = await hueApi.createLocal(ipAddress).connect(createdUser.username);

        // Do something with the authenticated user/api
        //const bridgeConfig = await authenticatedApi.configuration.get();
        //console.log(`Connected to Hue Bridge: ${bridgeConfig.name} :: ${bridgeConfig.ipaddress}`);

        this.emit("connected", integrationDefinition.id);
        this.connected = true;
    }
    disconnect() {
        // TODO: Disconnect from authed instance.

        this.emit("disconnected", integrationDefinition.id);
    }
    async link() {
        let settings = {};

        let hueUser = await this.discoverAndCreateUser();

        if (hueUser !== false) {
            settings.user = hueUser;

            this.emit("settings-update", integrationDefinition.id, settings);
            return settings;
        }

        renderWindow.webContents.send(
            "error",
            "Please press the link button on your hue bridge, then click the link button in Firebot."
        );
        throw new Error("Please press the link button on your hue bridge, then click the link button in Firebot.");
    }
    unlink() {
        // TODO: Disconnect from authed instance.
    }
    async discoverBridge() {
        const discoveryResults = await discovery.nupnpSearch();

        if (discoveryResults.length === 0) {
            logger.error('Failed to resolve any Hue Bridges');
            return null;
        }
        // Ignoring that you could have more than one Hue Bridge on a network as this is unlikely in 99.9% of users situations
        return discoveryResults[0].ipaddress;
    }
    async discoverAndCreateUser() {
        const ipAddress = await this.discoverBridge();

        // Create an unauthenticated instance of the Hue API so that we can create a new user
        const unauthenticatedApi = await hueApi.createLocal(ipAddress).connect();
        let createdUser;
        try {
            createdUser = await unauthenticatedApi.users.createUser(appName, deviceName);
            return createdUser;
        } catch (err) {
            if (err.getHueErrorType() === 101) {
                logger.warn('The Link button on the bridge was not pressed. Please press the Link button and try again.');
            } else {
                logger.error(`Unexpected Error: ${err.message}`);
            }

            return false;
        }
    }
}

module.exports = {
    definition: integrationDefinition,
    integration: new HueIntegration()
};
