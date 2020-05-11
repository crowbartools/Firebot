"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const logger = require("../../logwrapper");
const channelAccess = require("../../common/channel-access");

const model = {
    definition: {
        id: "firebot:channelProgression",
        name: "Give Progression (Hearts)",
        description: "Give hearts to a user, or take them away.",
        icon: "fad fa-heart",
        categories: [EffectCategory.COMMON, EffectCategory.CHAT_BASED, EffectCategory.MODERATION],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    optionsTemplate: `
        <eos-container header="Username">
            <div class="input-group">
                <span class="input-group-addon" id="hearts-username">Username</span>
                <input ng-model="effect.username" type="text" class="form-control" id="chat-username-setting" aria-describedby="chat-username" placeholder="Username" replace-variables menu-position="below">
            </div>
        </eos-container>
        <eos-container header="Hearts" pad-top="true">
            <div class="input-group">
                <span class="input-group-addon" id="hearts-effect-type">Number of hearts</span>
                <input ng-model="effect.progression" type="text" class="form-control" id="chat-progression-setting" aria-describedby="chat-progression-effect-type" placeholder="Enter number (can be negative)" replace-variables>
            </div>
        </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: effect => {
        let errors = [];
        if (effect.progression == null || effect.progression === "") {
            errors.push("You must enter the number of hearts to give.");
        }
        if (effect.username == null || effect.username === "") {
            errors.push("You must enter a username.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        let progressionTarget = await channelAccess.getIdsFromUsername(event.effect.username);

        if (progressionTarget != null) {
            channelAccess.giveHeartsToUser(progressionTarget.userId, event.effect.progression);
        } else {
            logger.error("User ID was invalid for channel progression effect.");
        }

        return true;
    }
};

module.exports = model;
