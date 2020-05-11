"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const chat = require("../../common/mixer-chat");

const streamgame = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:streamgame",
        name: "Set Stream Game",
        description: "Set the stream game.",
        icon: "fad fa-gamepad",
        categories: [EffectCategory.COMMON],
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
    <eos-container header="Stream game" pad-top="true">
        <textarea ng-model="effect.game" class="form-control" name="text" placeholder="Enter game name" rows="4" cols="40" replace-variables></textarea>
    </eos-container>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: () => {},
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.game == null) {
            errors.push("Please input the title of the game you'd like to use for the stream.");
        }
        return errors;
    },
    /**
   * When the effect is triggered do something
   */
    onTriggerEvent: async event => {
        chat.updateStreamGame(event.effect.game);
        return true;
    },
    /**
   * Code to run in the overlay
   */
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        event: {}
    }
};

module.exports = streamgame;
