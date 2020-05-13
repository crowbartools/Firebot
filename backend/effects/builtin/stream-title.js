"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const chat = require("../../common/mixer-chat");

const model = {
    definition: {
        id: "firebot:streamtitle",
        name: "Set Stream Title",
        description: "Set the title of the stream.",
        icon: "fad fa-comment-dots",
        categories: [EffectCategory.COMMON, EffectCategory.MODERATION],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    optionsTemplate: `
        <eos-container header="Stream title" pad-top="true">
            <input ng-model="effect.title" class="form-control" type="text" placeholder="Enter stream title" replace-variables menu-position="below">
        </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: effect => {
        let errors = [];
        if (effect.title == null) {
            errors.push("Please input the title you'd like to use for the stream.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        chat.updateStreamTitle(event.effect.title);
        return true;
    }
};

module.exports = model;
