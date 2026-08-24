"use strict";

const logger = require("../../logger-cache").LoggerCache.getLogger("Effects");
const { EffectCategory } = require('../../../shared/effect-constants');
const frontendCommunicator = require("../../common/frontend-communicator");

const effect = {
    definition: {
        id: "firebot:customscript",
        name: "Run Custom Script",
        description: "Run a custom JS script.",
        icon: "fad fa-code",
        categories: [EffectCategory.ADVANCED, EffectCategory.SCRIPTING],
        dependencies: []
    },
    optionsTemplate: `
        <custom-script-settings
            effect="effect"
            modal-id="modalId"
            trigger="trigger"
            trigger-meta="triggerMeta"
            script-type="script"
        />
    `,
    optionsController: () => {},
    optionsValidator: () => {
        const errors = [];
        return errors;
    },
    getDefaultLabel: (effect) => {
        return effect.scriptName ?? "No Script Selected";
    },
    onTriggerEvent: (event) => {
        return new Promise((resolve) => {

            logger.debug("Processing script...");

            const { PluginManager } = require("../../plugins/plugin-manager");

            PluginManager
                .runEffectScript(event.effect, event.trigger)
                .then((result) => {
                    if (result == null) {
                        return resolve(true);
                    }
                    if (result.success === false) {
                        if (result.error) {
                            frontendCommunicator.send('error', `Oops! There was an error processing the custom script. Error: ${result.error}`);
                        }
                        return resolve(false);
                    }
                    // Forward execution flow-control flags if present
                    if (result.execution != null) {
                        return resolve(result.execution);
                    }
                    resolve(true);
                })
                .catch((err) => {
                    frontendCommunicator.send('error', `Oops! There was an error processing the custom script. Error: ${err.message}`);
                    logger.error(err);
                    resolve(false);
                });

        });
    }
};

module.exports = effect;
