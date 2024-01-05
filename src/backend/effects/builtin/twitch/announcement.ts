import { EffectType } from "../../../../types/effects";
import { EffectCategory } from "../../../../shared/effect-constants";
import { HelixChatAnnouncementColor } from "@twurple/api";
import twitchApi from "../../../twitch-api/api";

const model: EffectType<{
    color: string;
    message: string;
    chatter?: string;
}> = {
    definition: {
        id: "firebot:announcement",
        name: "Announce",
        description: "Send an announcement to your chat",
        icon: "fad fa-bullhorn",
        categories: [EffectCategory.COMMON, EffectCategory.CHAT_BASED, EffectCategory.TWITCH],
        dependencies: {
            twitch: true
        }
    },
    optionsTemplate: `
        <eos-chatter-select effect="effect" title="Announce as"></eos-chatter-select>

        <eos-container header="Message" pad-top="true">
            <textarea ng-model="effect.message" class="form-control" name="text" placeholder="Enter message" rows="4" cols="40" replace-variables></textarea>
            <div style="color: #fb7373;" ng-if="effect.message && effect.message.length > 500">Announcement messages cannot be longer than 500 characters. This message will get automatically chunked into multiple messages if it's too long after all replace variables have been populated.</div>
        </eos-container>

        <eos-container header="Color" pad-top="true">
            <dropdown-select options="announcementColors" selected="effect.color"></dropdown-select>
        </eos-container>
    `,
    optionsController: ($scope) => {
        $scope.announcementColors = ["Primary", "Blue", "Green", "Orange", "Purple"];

        if ($scope.effect.color == null) {
            $scope.effect.color = "Primary";
        }
    },
    optionsValidator: ({ message }) => {
        const errors = [];
        if (message?.length < 1) {
            errors.push("Announcement message can't be blank.");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect }) => {
        const { message, chatter } = effect;
        const color = (effect.color.toLowerCase() ?? "primary") as HelixChatAnnouncementColor;

        await twitchApi.chat.sendAnnouncement(message, color, chatter?.toLowerCase() === "bot");

        return true;
    }
};

module.exports = model;
