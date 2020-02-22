"use strict";

const effectRunner = require("../../common/effect-runner");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

/**
 * The Random Effect effect
 */
const effectGroup = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:run-effect-list",
        name: "Run Effect List",
        description:
            "Run a given list of effects (Useful in Random Effects)",
        tags: ["Logic control", "Built in"],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    /**
   * Global settings that will be available in the Settings tab
   */
    globalSettings: {},
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `
    <eos-container>
        <p>All effects in the below list will be ran when this effect is ran. This is mostly useful when used in a Random Effect.</p>

        <effect-list effects="effect.effectList" 
                trigger="{{trigger}}" 
                trigger-meta="triggerMeta"
                update="effectListUpdated(effects)"
                modalId="{{modalId}}"></effect-list>
    </eos-container>

    `,
    /**
   * The controller for the front end Options
   */
    optionsController: $scope => {

        $scope.effectListUpdated = function(effects) {
            $scope.effect.effectList = effects;
        };

    },
    /**
   * When the effect is saved
   */
    optionsValidator: effect => {
        let errors = [];
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise((resolve, reject) => {
            let effectList = event.effect.effectList;

            if (!effectList || !effectList.list) {
                return resolve(true);
            }

            let processEffectsRequest = {
                trigger: event.trigger,
                effects: effectList
            };

            effectRunner.processEffects(processEffectsRequest).then(() => {
                resolve(true);
            });
        });
    }
};

module.exports = effectGroup;
