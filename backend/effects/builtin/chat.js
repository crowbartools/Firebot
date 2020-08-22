"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const twitchChat = require("../../chat/twitch-chat");

/**
 * The Chat Effect
 */
const chat = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:chat",
        name: "Chat",
        description: "Send a chat message.",
        icon: "fad fa-comment-lines",
        categories: [EffectCategory.COMMON, EffectCategory.CHAT_BASED],
        dependencies: [EffectDependency.CHAT],
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
    <eos-chatter-select effect="effect" title="Chat as"></eos-chatter-select>

    <eos-container header="Message To Send" pad-top="true">
        <textarea ng-model="effect.message" class="form-control" name="text" placeholder="Enter message" rows="4" cols="40" replace-variables></textarea>
        <div style="color: #fb7373;" ng-if="effect.message && effect.message.length > 500">Chat messages cannot be longer than 500 characters. This message will get automatically chunked into mutltiple messages if it's too long after all replace variables have been populated.</div>
        <div style="display: flex; flex-direction: row; width: 100%; height: 36px; margin: 10px 0 10px; align-items: center;">
            <label class="control-fb control--checkbox" style="margin: 0px 15px 0px 0px"> Whisper</tooltip>
                <input type="checkbox" ng-init="whisper = (effect.whisper != null && effect.whisper !== '')" ng-model="whisper" ng-click="effect.whisper = ''">
                <div class="control__indicator"></div>
            </label>
            <div ng-show="whisper">
                <div class="input-group">
                    <span class="input-group-addon" id="chat-whisper-effect-type">To</span>
                    <input ng-model="effect.whisper" type="text" class="form-control" id="chat-whisper-setting" aria-describedby="chat-text-effect-type" placeholder="Username" replace-variables>
                </div>
            </div>
        </div>
        <p ng-show="whisper" class="muted" style="font-size:11px;"><b>ProTip:</b> To whisper the associated user, put <b>$user</b> in the whisper field.</p>
    </eos-container>

    `,
    /**
   * The controller for the front end Options
   */
    optionsController: () => {},
    /**
   * When the effect is triggered by something
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.message == null || effect.message === "") {
            errors.push("Chat message can't be blank.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async event => {
        const { effect, trigger } = event;

        twitchChat.sendChatMessage(effect.message, null, effect.chatter);
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

module.exports = chat;
