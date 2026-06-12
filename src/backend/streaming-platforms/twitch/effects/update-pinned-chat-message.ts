import type { EffectType } from "../../../../types";
import { TwitchApi } from "../api";
import { LoggerCache } from "../../../logger-cache";

const logger = LoggerCache.getLogger("Effects");

const effect: EffectType<{
    pinUntilEndOfStream: boolean;
    pinDuration?: string;
}> = {
    definition: {
        id: "firebot:update-pinned-chat-message",
        name: "Update Pinned Chat Message",
        description: "Updates the currently pinned chat message",
        icon: "fas fa-thumbtack",
        categories: ["chat based", "advanced", "twitch"],
        dependencies: ["chat"]
    },
    optionsTemplate: `
        <eos-container header="Settings" pad-top="true">
            <firebot-checkbox
                label="Pin until end of stream"
                model="effect.pinUntilEndOfStream"
                style="margin: 0px 15px 0px 0px"
            />
            <firebot-input
                ng-show="effect.pinUntilEndOfStream !== true"
                model="effect.pinDuration"
                input-title="Duration (in secs)"
                placeholder-text="Enter duration"
            />
        </eos-container>
    `,
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.pinUntilEndOfStream !== true
            && !effect.pinDuration?.length
        ) {
            errors.push("Must choose pin duration");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect }) => {
        const pinnedMessage = await TwitchApi.chat.getPinnedChatMessage();

        if (pinnedMessage) {
            let pinDuration: number = undefined;

            if (effect.pinUntilEndOfStream !== true && !!effect.pinDuration?.length) {
                pinDuration = Number(effect.pinDuration);

                if (isNaN(pinDuration)) {
                    pinDuration = undefined;
                } else if (pinDuration < 30) {
                    pinDuration = 30;
                } else if (pinDuration > 1800) {
                    pinDuration = 1800;
                }
            }

            await TwitchApi.chat.updatePinnedChatMessage(pinnedMessage.messageId, pinDuration);
        } else {
            logger.warn("No pinned message to update");
            return false;
        }

        return true;
    }
};

export = effect;