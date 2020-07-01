"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;
const { EffectCategory } = require('../../../shared/effect-constants');

const model = {
    definition: {
        id: "firebot:changescene",
        name: "Change MixPlay Scene (Deprecated)",
        description: "Change viewer(s) between scenes",
        icon: "fad fa-th-large",
        hidden: true,
        categories: [EffectCategory.COMMON, EffectCategory.MIXPLAY],
        dependencies: [EffectDependency.INTERACTIVE],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `
        <eos-container header="Invalid Effect">
            <div class="effect-info alert alert-info" style="margin-bottom:0;">
                This effect was built for Mixplay and no longer works.
            </div>
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: ($scope, mixplayService) => {},
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
    onTriggerEvent: async () => true
};

module.exports = model;
