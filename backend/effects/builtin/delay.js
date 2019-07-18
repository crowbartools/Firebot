"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const webServer = require("../../../server/httpServer");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

/**
 * The Delay effect
 */
const delay = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:delay",
        name: "Delay",
        description: "Pause between effects",
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
        <eos-container header="Duration">
            <div class="input-group">
                <span class="input-group-addon" id="delay-length-effect-type">Seconds</span>
                <input ng-model="effect.delay" type="text" class="form-control" aria-describedby="delay-length-effect-type" type="number">
            </div>
        </eos-container>

        <eos-container>
            <div class="effect-info alert alert-info">
                Note: Delays dont wait for the previous effect to finish so take that into account, if required. For example, if your first effect plays a sound thats 10 seconds long and you want a 10 second delay after that sound, make the delay last 20 seconds.
            </div>
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: $scope => {},
    /**
   * When the effect is saved
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.delay == null || effect.delay.length < 1) {
            errors.push("Please input a delay duration.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise((resolve, reject) => {
            let effect = event.effect;

            // wait for the specified time before resolving.
            setTimeout(() => {
                resolve(true);
            }, effect.delay * 1000);
        });
    }
};

module.exports = delay;
