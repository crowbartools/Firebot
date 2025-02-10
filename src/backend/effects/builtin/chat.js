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
        <firebot-input
            model="effect.message"
            use-text-area="true"
            placeholder-text="Enter message"
            rows="4"
            cols="40"
            menu-position="under"
        />
        <div style="color: #fb7373;" ng-if="effect.message && effect.message.length > 500">Chat messages cannot be longer than 500 characters. This message will get automatically chunked into multiple messages if it is too long after all replace variables have been populated.</div>
        <div style="display: flex; flex-direction: row; width: 100%; height: 36px; margin: 10px 0 10px; align-items: center;">
            <firebot-checkbox
                label="Use '/me'"
                tooltip="Applies Italics to your Chat Message or your Chat Color if used in a Whisper"
                model="effect.me"
                style="margin: 0px 15px 0px 0px"
            />
            <firebot-checkbox
                label="Whisper"
                model="showWhisperInput"
                style="margin: 0px 15px 0px 0px"
                ng-click="effect.whisper = ''"
            />
            <div ng-show="showWhisperInput">
                <firebot-input
                    input-title="To"
                    model="effect.whisper"
                    placeholder-text="Username"
                    force-input="true"
                />
            </div>
        </div>
        <p ng-show="effect.whisper" class="muted" style="font-size:11px;"><b>ProTip:</b> To whisper the associated user, put <b>$user</b> in the whisper field.</p>
        <div ng-hide="effect.whisper">
            <firebot-checkbox
                label="Send as reply"
                tooltip="Replying only works within a Command or Chat Message event"
                model="effect.sendAsReply"
                style="margin: 0px 15px 0px 0px"
            />
        </div>
    </eos-container>

    `,
    optionsController: ($scope) => {
        $scope.showWhisperInput = $scope.effect.whisper != null && $scope.effect.whisper !== '';
    },
    optionsValidator: (effect) => {
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

        if (effect.me) {
            effect.message = `/me ${effect.message}`;
        }

        await twitchChat.sendChatMessage(effect.message, effect.whisper, effect.chatter, !effect.whisper && effect.sendAsReply ? messageId : undefined);

        return true;
    }
};

module.exports = effect;
