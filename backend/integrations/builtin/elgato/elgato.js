"use strict";

const EventEmitter = require("events");
const { ElgatoLightAPI } = require("elgato-light-api");
const effectManager = require("../../../effects/effectManager");
const frontendCommunicator = require("../../../common/frontend-communicator");

const integrationDefinition = {
    id: "elgato",
    name: "Elgato",
    description: "Interact with Elgato Lights.",
    linkType: "none",
    connectionToggle: false,
    configurable: false
};

class ElgatoIntegration extends EventEmitter {
    constructor() {
        super();

        this.lightAPI = null;

        /** @type {import("elgato-light-api").KeyLight[]} */
        this.keyLights = [];
    }

    init() {
        effectManager.registerEffect(require('./effects/update-key-lights'));

        this.lightAPI = new ElgatoLightAPI();
        this.lightAPI.on('newLight', /** @arg {import("elgato-light-api").KeyLight} newLight */ (newLight) => {
            this.addNewKeyLight(newLight);
        });

        frontendCommunicator.onAsync("getKeyLights", async () => {
            return this.getAllKeyLights();
        });
    }
    onUserSettingsUpdate() {}
    connect() {}
    disconnect() {}
    link() {}
    unlink() {}

    addNewKeyLight(newLight) {
        this.keyLights.push(newLight);
    }

    getAllKeyLights() {
        return this.lightAPI.keyLights || [];
    }

    async updateKeyLights(selectedKeyLights) {
        selectedKeyLights.forEach(keyLight => {
            const light = this.lightAPI.keyLights.find(kl => kl.name === keyLight.light.name);
            const settings = {};

            switch (keyLight.options.toggleType) {
            case "toggle":
                settings.on = light.options.lights[0].on === 1 ? 0 : 1;
                break;
            case "enable":
                settings.on = 1;
                break;
            case "disable":
                settings.on = 0;
                break;
            }

            const options = {
                numberOfLights: 1,
                lights: [settings]
            };

            this.lightAPI.updateLightOptions(light, options);
        });
    }
}

module.exports = {
    definition: integrationDefinition,
    integration: new ElgatoIntegration()
};
