import type { EffectType } from "../../../../types/effects";
import { AccountAccess } from "../../../common/account-access";
import { TwitchApi } from "../api";

const model: EffectType<{
    action: "Enable Shield Mode" | "Disable Shield Mode";
}> = {
    definition: {
        id: "firebot:shield-mode",
        name: "Enable/Disable Shield Mode",
        description: "Enable or disable Shield Mode on your Twitch channel",
        icon: "fad fa-shield",
        categories: ["common", "moderation", "twitch"],
        dependencies: {
            twitch: true
        }
    },
    optionsTemplate: `
        <eos-container header="Action">
            <div class="btn-group">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="list-effect-type">{{effect.action ? effect.action : 'Pick one'}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu">
                    <li ng-click="effect.action = 'Enable Shield Mode'">
                        <a href>Enable Shield Mode</a>
                    </li>
                    <li ng-click="effect.action = 'Disable Shield Mode'">
                        <a href>Disable Shield Mode</a>
                    </li>
                </ul>
            </div>
        </eos-container>
    `,
    optionsValidator: (effect) => {
        const errors: string[] = [];

        if (effect.action == null) {
            errors.push("You must select a Shield Mode action");
        }

        return errors;
    },
    optionsController: () => {},
    getDefaultLabel: (effect) => {
        return effect.action || "";
    },
    onTriggerEvent: async ({ effect }) => {
        const activate = effect.action === "Enable Shield Mode";
        const streamerUserId: string = AccountAccess.getAccounts().streamer.userId;
        await TwitchApi.moderationClient.moderation.updateShieldModeStatus(streamerUserId, activate);
    }
};

export = model;
