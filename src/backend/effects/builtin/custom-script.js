"use strict";

const logger = require("../../logwrapper");
const customScriptRunner = require("../../common/handlers/custom-scripts/custom-script-runner");
const { EffectCategory } = require('../../../shared/effect-constants');
const frontendCommunicator = require("../../common/frontend-communicator");

/**
 * The custom var effect
 */
const fileWriter = {
    /**
   * The definition of the Effect
   */
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
            allow-startup="isStartup"
        />
    `,
    optionsController: ($scope) => {

        $scope.isStartup = $scope.trigger === "event"
            && $scope.triggerMeta != null
            && $scope.triggerMeta.triggerId === "firebot:firebot-started";

    },
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

            customScriptRunner
                .runScript(event.effect, event.trigger)
                .then((result) => {
                    resolve(result != null ? result : true);
                })
                .catch((err) => {
                    frontendCommunicator.send('error', `Oops! There was an error processing the custom script. Error: ${err.message}`);
                    logger.error(err);
                    resolve(false);
                });

        });
    }
};

module.exports = fileWriter;
