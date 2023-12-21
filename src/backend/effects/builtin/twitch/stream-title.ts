import { EffectType } from "../../../../types/effects";
import { EffectCategory } from "../../../../shared/effect-constants";
import accountAccess from "../../../common/account-access";
import twitchApi from "../../../twitch-api/api";

const model: EffectType<{
    title: string;
}> = {
    definition: {
        id: "firebot:streamtitle",
        name: "Set Stream Title",
        description: "Set the title of the stream.",
        icon: "fad fa-comment-dots",
        categories: [EffectCategory.COMMON, EffectCategory.MODERATION, EffectCategory.TWITCH],
        dependencies: {
            twitch: true
        }
    },
    optionsTemplate: `
        <eos-container header="New Title" pad-top="true">
            <input ng-model="effect.title" class="form-control" type="text" placeholder="Enter text" replace-variables menu-position="below">
            <p ng-show="trigger == 'command'" class="muted" style="font-size:11px;margin-top:6px;"><b>ProTip:</b> Use <b>$arg[all]</b> to include every word after the command !trigger.</p>
        </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.title == null) {
            errors.push("Please input the title you'd like to use for the stream.");
        }
        return errors;
    },
    onTriggerEvent: async (event) => {
        const client = twitchApi.streamerClient;

        await client.channels.updateChannelInfo(accountAccess.getAccounts().streamer.userId, {
            title: event.effect.title
        });
        return true;
    }
};

module.exports = model;
