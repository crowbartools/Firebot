"use strict";

const { EffectCategory, EffectTrigger, EffectDependency } = require('../../../shared/effect-constants');
const twitchChat = require("../../chat/twitch-chat");

const effect = {
    definition: {
        id: "firebot:chat",
        name: "Chat",
        description: "Send a chat message.",
        icon: "fad fa-comment-lines",
        categories: [EffectCategory.COMMON, EffectCategory.CHAT_BASED, EffectCategory.TWITCH],
        dependencies: [EffectDependency.CHAT]
    },
    optionsTemplate: `
    <eos-chatter-select effect="effect" title="Chat as"></eos-chatter-select>

    <eos-container header="Message To Send" pad-top="true">
        <textarea ng-model="effect.message" class="form-control" name="text" placeholder="Enter message" rows="4" cols="40" replace-variables></textarea>
        <div style="color: #fb7373;" ng-if="effect.message && effect.message.length > 500">Chat messages cannot be longer than 500 characters. This message will get automatically chunked into multiple messages if it's too long after all replace variables have been populated.</div>
        <div style="display: flex; flex-direction: row; width: 100%; height: 36px; margin: 10px 0 10px; align-items: center;">
            <label class="control-fb control--checkbox" style="margin: 0px 15px 0px 0px"> Whisper
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
        <div ng-hide="whisper">
            <label class="control-fb control--checkbox" style="margin: 0px 15px 0px 0px"> Send as reply<tooltip text="'Replying only works within a Command or Chat Message event'"></tooltip>
                <input type="checkbox" ng-model="effect.sendAsReply">
                <div class="control__indicator"></div>
            </label>
        </div>
    </eos-container>

    `,
    optionsController: () => {},
    optionsValidator: effect => {
        const errors = [];
        if (effect.message == null || effect.message === "") {
            errors.push("Chat message can't be blank.");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect, trigger}) => {
        let messageId = null;
        if (trigger.type === EffectTrigger.COMMAND) {
            messageId = trigger.metadata.chatMessage.id;
        } else if (trigger.type === EffectTrigger.EVENT) {
            messageId = trigger.metadata.eventData?.chatMessage?.id;
        }

        await twitchChat.sendChatMessage(effect.message, effect.whisper, effect.chatter, !effect.whisper && effect.sendAsReply ? messageId : undefined);

        return true;
    }
};

module.exports = effect;
