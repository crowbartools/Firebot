"use strict";

const { EffectCategory } = require("../../../../../shared/effect-constants");
const request = require("request");
const integrationManager = require("../../../IntegrationManager");

/** @type {import("../../../../effects/models/effectModels").Effect */
const effect = {
    definition: {
        id: "streamlabs:spin-wheel",
        name: "Spin The Wheel",
        description: "Trigger StreamLab's \"Spin the Wheel\" feature",
        icon: "fad fa-tire",
        categories: [EffectCategory.INTEGRATIONS],
        dependencies: []
    },
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
    onTriggerEvent: () => {
        return new Promise(resolve => {

            const streamlabs = integrationManager.getIntegrationDefinitionById("streamlabs");

            const accessToken = streamlabs.auth && streamlabs.auth["access_token"];
            if (accessToken) {
                request.post(`https://streamlabs.com/api/v1.0/wheel/spin`, {
                    json: {
                        "access_token": accessToken
                    }
                });
            }

            resolve(true);
        });
    }
};

module.exports = effect;
