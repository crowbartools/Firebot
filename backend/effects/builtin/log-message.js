"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');
const logger = require("../../../backend/logwrapper");

const addFirebotLogMessage = {
    definition: {
        id: "firebot:log-message",
        name: "Log Message",
        description: "Adds an entry to the Firebot log. This is useful for debugging.",
        icon: "fad fa-file-alt",
        categories: [EffectCategory.ADVANCED, EffectCategory.SCRIPTING],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container header="Message Text">
            <p class="muted">Enter the message you would like to write to the Firebot log file.</p>
            <input ng-model="effect.logMessage" id="log-message-text" type="text" class="form-control" placeholder="Enter log message text" replace-variables>
        </eos-container>
    `,
    optionsValidator: effect => {
        let errors = [];
        if (effect.logMessage == null || effect.logMessage === "") {
            errors.push("Please input a log message.");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect }) => {
        logger.info(effect.logMessage);
    }
};

module.exports = addFirebotLogMessage;