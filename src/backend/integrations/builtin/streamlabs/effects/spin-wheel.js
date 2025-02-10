"use strict";

const { EffectCategory } = require("../../../../../shared/effect-constants");
const integrationManager = require("../../../integration-manager");
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
                const response = await fetch("https://streamlabs.com/api/v1.0/wheel/spin",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ "access_token": accessToken })
                    });

                if (response.ok) {
                    return true;
                }

                throw new Error(`Request failed with status ${response.status}`);
            } catch (error) {
                logger.error("Failed to spin Streamlabs wheel", error.message);
                return false;
            }
        }
    }
};

module.exports = effect;
