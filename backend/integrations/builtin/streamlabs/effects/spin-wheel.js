"use strict";

const { ControlKind, InputEvent } = require('../../../../interactive/constants/MixplayConstants');
const effectModels = require("../../../../effects/models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require("../../../../../shared/effect-constants");

const request = require("request");

const integrationManager = require("../../../IntegrationManager");

const effect = {
    definition: {
        id: "streamlabs:spin-wheel",
        name: "Spin The Wheel",
        description: "Trigger StreamLab's \"Spin the Wheel\" feature",
        icon: "fad fa-tire",
        categories: [EffectCategory.INTEGRATIONS],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
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
