import type { EffectType } from "../../../types";
import { LoggerCache } from "../../logger-cache";

import { TwitchApi } from '../../streaming-platforms/twitch/api';

const logger = LoggerCache.getLogger("Effects");

const effect: EffectType<{
    chatter: string;
    message: string;
    me: boolean;
    whisper: string;
    sendAsReply: boolean;
    pin: boolean;
    pinUntilEndOfStream: boolean;
    pinDuration?: string;
}> = {
    definition: {
        id: "firebot:chat",
        name: "Chat",
        description: "Send a chat message.",
        icon: "fad fa-comment-lines",
        categories: ["common", "chat based", "twitch"],
        dependencies: ["chat"]
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

    <eos-container header="Pin Message" pad-top="true" ng-hide="effect.whisper">
        <div style="display: flex; flex-direction: row; width: 100%; margin: 0 0 10px 0; align-items: center;">
            <firebot-checkbox
                label="Pin message"
                tooltip="Pin message to the top of chat"
                model="effect.pin"
                style="margin: 0px 15px 0px 0px"
            />
            <firebot-checkbox
                ng-show="effect.pin === true"
                label="Pin until end of stream"
                model="effect.pinUntilEndOfStream"
                style="margin: 0px 15px 0px 0px"
            />
        </div>
        <firebot-input
            ng-show="effect.pin === true && effect.pinUntilEndOfStream !== true"
            model="effect.pinDuration"
            input-title="Duration (in secs)"
            placeholder-text="Enter duration"
        />
    </eos-container>

    `,
    optionsController: ($scope) => {
        $scope.showWhisperInput = $scope.effect.whisper != null && $scope.effect.whisper !== '';
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.message == null || effect.message === "") {
            errors.push("Chat message can't be blank.");
        }
        if (effect.pin === true
            && effect.pinUntilEndOfStream !== true
            && !effect.pinDuration?.length
        ) {
            errors.push("Must choose pin duration");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect, trigger }) => {
        let messageId: string = null;
        if (trigger.type === "command") {
            messageId = trigger.metadata.chatMessage.id;
        } else if (trigger.type === "event") {
            messageId = trigger.metadata.eventData?.chatMessage?.id;
        }

        if (effect.me) {
            effect.message = `/me ${effect.message}`;
        }

        // We default to sending as the bot unless the user specifies otherwise
        const sendAsBot = (effect.chatter == null || effect.chatter.toLowerCase() === "bot");

        if (effect.whisper) {
            const user = await TwitchApi.users.getUserByName(effect.whisper);
            await TwitchApi.whispers.sendWhisper(user.id, effect.message, sendAsBot);
        } else {
            const sendResult = await TwitchApi.chat.sendChatMessage(effect.message, effect.sendAsReply ? messageId : null, sendAsBot);

            if (effect.pin === true) {
                if (sendResult.success === true) {
                    if (sendResult.isSlashCommand !== true) {
                        let pinDuration: number = undefined;

                        if (effect.pinUntilEndOfStream !== true
                            && !!effect.pinDuration?.length
                        ) {
                            pinDuration = Number(effect.pinDuration);

                            if (isNaN(pinDuration)) {
                                pinDuration = undefined;
                            } else if (pinDuration < 30) {
                                pinDuration = 30;
                            } else if (pinDuration > 1800) {
                                pinDuration = 1800;
                            }
                        }

                        await TwitchApi.chat.pinChatMessage(sendResult.messageId, pinDuration);
                    } else {
                        logger.warn("Chat message not pinned due to being processed as slash command");
                    }
                } else {
                    logger.warn("Message failed to send. Unable to pin.");
                }
            }
        }

        return true;
    }
};

export = effect;