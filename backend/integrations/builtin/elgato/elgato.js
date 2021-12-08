"use strict";

const EventEmitter = require("events");
const elgatoManager = require("./elgato-manager");
const { ElgatoLightAPI } = require("elgato-light-api");
const effectManager = require("../../../effects/effectManager");

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
    }
    init() {
        effectManager.registerEffect(require('./effects/update-key-lights'));

        const lightAPI = new ElgatoLightAPI();
        lightAPI.on('newLight', /** @arg {import("elgato-light-api").KeyLight} newLight */ (newLight) => {
            elgatoManager.addNewKeyLight(newLight);
        });
    }
    onUserSettingsUpdate() {}
    connect() {}
    disconnect() {}
    link() {}
    unlink() {}
}

module.exports = {
    definition: integrationDefinition,
    integration: new ElgatoIntegration()
};
