"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const channelAccess = require("../../common/channel-access");

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
        <eos-container header="New Title" pad-top="true">
            <input ng-model="effect.title" class="form-control" type="text" placeholder="Enter text" replace-variables menu-position="below">
            <p ng-show="trigger == 'command'" class="muted" style="font-size:11px;margin-top:6px;"><b>ProTip:</b> Use <b>$arg[all]</b> to include every word after the command !trigger.</p>
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
        await channelAccess.setStreamTitle(event.effect.title);
        return true;
    }
};

module.exports = model;
