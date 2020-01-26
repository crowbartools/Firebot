"use strict";


const { ControlKind, InputEvent } = require('../../../interactive/constants/MixplayConstants');
const effectModels = require("../../models/effectModels");
const { EffectTrigger } = effectModels;

/**
 * The custom var effect
 */
const model = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:conditional-effects",
        name: "Conditional Effects",
        description: "Conditionally run effects",
        tags: ["Built in"],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    globalSettings: {},
    optionsTemplate: `

    `,
    optionsController: ($scope, listenerService) => {},
    optionsValidator: effect => {
        let errors = [];
        return errors;
    },
    onTriggerEvent: event => {
        return new Promise(async (resolve) => {
            // What should this do when triggered.
            let effect = event.effect;


            resolve(true);
        });
    }
};

module.exports = model;
