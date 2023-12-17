"use strict";

const { EffectCategory } = require("../../../../../shared/effect-constants");
const integrationManager = require("../../../integration-manager");
const axios = require("axios").default;
const logger = require("../../../../logwrapper");

const effect = {
    definition: {
        id: "streamlabs:spin-wheel",
        name: "Spin The Wheel",
        description: "Trigger StreamLab's \"Spin the Wheel\" feature",
        icon: "fad fa-tire",
        categories: [EffectCategory.INTEGRATIONS],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container>
            <div class="effect-info alert alert-info">
                This will trigger StreamLab's "Spin the Wheel" feature.
            </div>
        </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: () => {
    },
    onTriggerEvent: async () => {
        const streamlabs = integrationManager.getIntegrationDefinitionById("streamlabs");
        const accessToken = streamlabs.auth && streamlabs.auth["access_token"];

        if (accessToken) {
            try {
                await axios.post("https://streamlabs.com/api/v1.0/wheel/spin",
                    {
                        "access_token": accessToken
                    });

                return true;
            } catch (error) {
                logger.error("Failed to spin Streamlabs wheel", error.message);
                return false;
            }
        }
    }
};

module.exports = effect;
