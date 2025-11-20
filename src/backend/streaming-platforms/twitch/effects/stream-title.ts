import type { EffectType } from "../../../../types/effects";
import { AccountAccess } from "../../../common/account-access";
import { TwitchApi } from "../api";

const model: EffectType<{
    title: string;
}> = {
    definition: {
        id: "firebot:streamtitle",
        name: "Set Stream Title",
        description: "Set the title of the stream.",
        icon: "fad fa-comment-dots",
        categories: ["common", "twitch"],
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
        const errors: string[] = [];
        if (effect.title == null) {
            errors.push("Please input the title you'd like to use for the stream.");
        }
        return errors;
    },
    onTriggerEvent: async (event) => {
        const client = TwitchApi.streamerClient;

        await client.channels.updateChannelInfo(AccountAccess.getAccounts().streamer.userId, {
            title: event.effect.title
        });
        return true;
    }
};

export = model;
