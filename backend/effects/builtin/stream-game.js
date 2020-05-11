"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const chat = require("../../common/mixer-chat");

const model = {
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
    optionsTemplate: `
        <eos-container header="Stream game" pad-top="true">
            <textarea ng-model="effect.game" class="form-control" name="text" placeholder="Enter game name" rows="4" cols="40" replace-variables></textarea>
        </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: effect => {
        let errors = [];
        if (effect.game == null) {
            errors.push("Please input the title of the game you'd like to use for the stream.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        chat.updateStreamGame(event.effect.game);
        return true;
    }
};

module.exports = model;
