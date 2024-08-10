import { EffectType } from "../../../../types/effects";
import { EffectCategory } from "../../../../shared/effect-constants";
import twitchApi from "../../../twitch-api/api";
import adManager from "../../../twitch-api/ad-manager";

const model: EffectType = {
    definition: {
        id: "twitch:snooze-ad-break",
        name: "Snooze Next Ad Break",
        description: "Pushes back the next scheduled mid-roll ad break by 5 minutes",
        icon: "fad fa-snooze",
        categories: [
            EffectCategory.COMMON,
            EffectCategory.MODERATION,
            EffectCategory.TWITCH
        ],
        dependencies: {
            twitch: true
        }
    },
    optionsTemplate: `
        <eos-container>
            <div class="effect-info alert alert-warning">
                Note: You must be an affiliate or partner to use this effect.
                Also, Twitch limits the number of times you may snooze mid-roll ads.
                If you have snoozed ads too many times in a short period, Twitch will deny this.
            </div>
        </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: () => {
        return [];
    },
    onTriggerEvent: async () => {
        const result = await twitchApi.channels.snoozeAdBreak();

        if (result === true) {
            await adManager.runAdCheck();
        }

        return result;
    }
};

module.exports = model;