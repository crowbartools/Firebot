"use strict";

const EventEmitter = require("events");
const { ElgatoKeyLightController, ElgatoLightStripController } = require("@zunderscore/elgato-light-control");
const effectManager = require("../../../effects/effectManager");
const frontendCommunicator = require("../../../common/frontend-communicator");
const logger = require("../../../logwrapper");
const colorConvert = require('color-convert');

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

        this.keyLightController = null;
        this.lightStripController = null;
    }

    init() {
        effectManager.registerEffect(require('./effects/update-key-lights'));
        effectManager.registerEffect(require('./effects/update-light-strips'));

        this.keyLightController = new ElgatoKeyLightController();
        this.lightStripController = new ElgatoLightStripController();

        frontendCommunicator.onAsync("getKeyLights", async () => {
            return this.keyLightController.keyLights || [];
        });

        frontendCommunicator.onAsync("getLightStrips", async () => {
            return this.lightStripController.lightStrips || [];
        });
    }

    async updateKeyLights(selectedKeyLights) {
        selectedKeyLights.forEach(keyLight => {
            const light = this.keyLightController.keyLights.find(kl => kl.name === keyLight.light.name);
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

            if (keyLight.options.brightness) {
                settings.brightness = parseInt(keyLight.options.brightness);
            }

            if (keyLight.options.temperature) {
                settings.temperature = Math.round(1000000 / parseInt(keyLight.options.temperature));
            }

            /** @type {import("@zunderscore/elgato-light-control").KeyLightOptions} */
            const options = {
                numberOfLights: 1,
                lights: [settings]
            };

            try {
                this.keyLightController.updateLightOptions(light, options);
            } catch (err) {
                logger.debug("Failed to update Elgato Key Light", err.message);
            }

        });
    }

    async updateLightStrips(selectedLightStrips) {
        selectedLightStrips.forEach(lightStrip => {
            const light = this.lightStripController.lightStrips.find(ls => ls.name === lightStrip.light.name);
            const settings = {};

            switch (lightStrip.options.toggleType) {
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

            if (lightStrip.options.color) {
                let colorValue;

                // Strip out the # for #RRGGBB values
                if (lightStrip.options.color.startsWith("#")) {
                    colorValue = lightStrip.options.color.slice(1);
                } else {
                    colorValue = lightStrip.options.color;
                }

                const hexCodeRegEx = /^[0-9a-fA-F]{6}$/;
                let hsvColor = [];

                // If the color value is a hex RRGGBB value, convert from that hex value
                if (hexCodeRegEx.test(colorValue) === true) {
                    hsvColor = colorConvert.hex.hsv(colorValue);

                // Otherwise, convert from the color name
                } else {
                    try {
                        hsvColor = colorConvert.keyword.hsv(colorValue.toLowerCase());
                    } catch {
                        logger.debug(`Unable to convert "${colorValue}" to HSV color`);
                        return;
                    }
                }

                settings.hue = parseInt(hsvColor[0]);
                settings.saturation = parseInt(hsvColor[1]);
                settings.brightness = parseInt(hsvColor[2]);
            }

            /** @type {import("@zunderscore/elgato-light-control").LightStripOptions} */
            const options = {
                numberOfLights: 1,
                lights: [settings]
            };

            try {
                this.lightStripController.updateLightOptions(light, options);
            } catch (err) {
                logger.debug("Failed to update Elgato Light Strip", err.message);
            }

        });
    }
}

module.exports = {
    definition: integrationDefinition,
    integration: new ElgatoIntegration()
};
