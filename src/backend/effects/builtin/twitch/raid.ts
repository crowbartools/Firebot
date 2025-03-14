import { EffectType } from "../../../../types/effects";
import { EffectCategory } from "../../../../shared/effect-constants";
import logger from "../../../logwrapper";
import twitchApi from "../../../twitch-api/api";

const model: EffectType<{
    action: "Raid Channel" | "Cancel Raid";
    username?: string;
}> = {
    definition: {
        id: "firebot:raid",
        name: "Raid/Unraid Twitch Channel",
        description: "Start or cancel a raid to another Twitch channel",
        icon: "fad fa-rocket-launch",
        categories: [EffectCategory.COMMON, EffectCategory.TWITCH],
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
                    <li ng-click="effect.action = 'Raid Channel'">
                        <a href>Raid Channel</a>
                    </li>
                    <li ng-click="effect.action = 'Cancel Raid'">
                        <a href>Cancel Raid</a>
                    </li>
                </ul>
            </div>
        </eos-container>

        <eos-container header="Target" pad-top="true" ng-show="effect.action === 'Raid Channel'">
            <firebot-input model="effect.username" placeholder-text="Enter username" />
        </eos-container>
    `,
    optionsValidator: (effect) => {
        const errors: string[] = [];
        const username = effect.username?.trim();

        if (effect.action == null) {
            errors.push("You must select a raid action");
        } else if (effect.action === "Raid Channel" && !username?.length) {
            errors.push("You must specify a channel to raid");
        }

        return errors;
    },
    optionsController: () => {},
    getDefaultLabel: (effect) => {
        if (effect.action === "Cancel Raid") {
            return "Cancel Raid";
        }
        return effect.username;
    },
    onTriggerEvent: async ({ effect }) => {
        if (effect.action === "Raid Channel") {
            const targetUserId = (await twitchApi.users.getUserByName(effect.username))?.id;

            if (targetUserId == null) {
                logger.error(`Unable to start raid. Twitch user ${effect.username} does not exist.`);
                return false;
            }

            await twitchApi.channels.raidChannel(targetUserId);
        } else {
            await twitchApi.channels.cancelRaid();
        }
    }
};

module.exports = model;
