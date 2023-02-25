import { EffectType } from "../../../types/effects";
import { EffectCategory } from "../../../shared/effect-constants";
import twitchApi from "../../twitch-api/api";
import { TwitchCommandHelpers } from "../../chat/twitch-commands/twitch-command-helpers";

const model: EffectType<{
    setFollowersOnly: boolean;
    enableFollowersOnly?: boolean;
    followersOnlyDuration?: string;

    setSubscribersOnly: boolean;
    enableSubscribersOnly?: boolean;

    setEmoteOnly: boolean;
    enableEmoteOnly?: boolean;

    setSlowMode: boolean;
    enableSlowMode?: boolean;
    slowModeDelay?: number;
}>  = {
    definition: {
        id: "firebot:set-chat-mode",
        name: "Set Chat Mode",
        description: "Sets the chat mode(s) for your Twitch channel",
        icon: "fad fa-comment-check",
        categories: [ EffectCategory.COMMON, EffectCategory.TWITCH ],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="Chat Modes">
            <firebot-checkbox
                model="effect.setFollowersOnly"
                label="Set Followers-Only Mode"
                tooltip="Whether or not you want to change the followers-only mode of your Twitch channel chat."
            />

            <div class="btn-group mb-4" ng-if="effect.setFollowersOnly === true">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="list-effect-type">{{effect.enableFollowersOnly == null ? 'Pick one' : (effect.enableFollowersOnly === true ? 'Enable' : 'Disable')}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu">
                    <li ng-click="effect.enableFollowersOnly = true">
                        <a href>Enable</a>
                    </li>
                    <li ng-click="effect.enableFollowersOnly = false">
                        <a href>Disable</a>
                    </li>
                </ul>
            </div>

            <firebot-input
                style="margin-bottom: 2rem;"
                ng-if="effect.setFollowersOnly === true && effect.enableFollowersOnly === true"
                model="effect.followersOnlyDuration"
                input-title="Follow Duration"
                placeholder-text="Duration (formats: 1m / 1h / 1d / 1w / 1mo)"
            />
            
            <firebot-checkbox
                model="effect.setSubscribersOnly"
                label="Set Subscribers-Only Mode"
                tooltip="Whether or not you want to change the subscribers-only mode of your Twitch channel chat."
            />

            <div class="btn-group mb-8" ng-if="effect.setSubscribersOnly === true">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="list-effect-type">{{effect.enableSubscribersOnly == null ? 'Pick one' : (effect.enableSubscribersOnly === true ? 'Enable' : 'Disable')}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu">
                    <li ng-click="effect.enableSubscribersOnly = true">
                        <a href>Enable</a>
                    </li>
                    <li ng-click="effect.enableSubscribersOnly = false">
                        <a href>Disable</a>
                    </li>
                </ul>
            </div>
            
            <firebot-checkbox
                model="effect.setEmoteOnly"
                label="Set Emote-Only Mode"
                tooltip="Whether or not you want to change the emote-only mode of your Twitch channel chat."
            />

            <div class="btn-group mb-8" ng-if="effect.setEmoteOnly === true">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="list-effect-type">{{effect.enableEmoteOnly == null ? 'Pick one' : (effect.enableEmoteOnly === true ? 'Enable' : 'Disable')}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu">
                    <li ng-click="effect.enableEmoteOnly = true">
                        <a href>Enable</a>
                    </li>
                    <li ng-click="effect.enableEmoteOnly = false">
                        <a href>Disable</a>
                    </li>
                </ul>
            </div>
            
            <firebot-checkbox
                model="effect.setSlowMode"
                label="Set Slow Mode"
                tooltip="Whether or not you want to change the slow mode of your Twitch channel chat."
            />

            <div class="btn-group mb-4" ng-if="effect.setSlowMode === true">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="list-effect-type">{{effect.enableSlowMode == null ? 'Pick one' : (effect.enableSlowMode === true ? 'Enable' : 'Disable')}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu">
                    <li ng-click="effect.enableSlowMode = true">
                        <a href>Enable</a>
                    </li>
                    <li ng-click="effect.enableSlowMode = false">
                        <a href>Disable</a>
                    </li>
                </ul>
            </div>

            <firebot-input
                ng-if="effect.setSlowMode === true && effect.enableSlowMode === true"
                model="effect.slowModeDelay"
                input-title="Delay (Seconds)"
                placeholder-text="Optional"
            />
        </eos-container>
    `,
    optionsValidator: (effect) => {
        const errors: string[] = [];

        if (effect.setFollowersOnly === true && effect.enableFollowersOnly == null) {
            errors.push("You must select a followers-only action");
        } else if (effect.setSubscribersOnly === true && effect.enableSubscribersOnly == null) {
            errors.push("You must specify a subscribers-only action");
        } else if (effect.setEmoteOnly === true && effect.enableEmoteOnly == null) {
            errors.push("You must specify an emote-only action");
        } else if (effect.setSlowMode === true && effect.enableSlowMode == null) {
            errors.push("You must specify a slow mode action");
        }

        return errors;
    },
    optionsController: () => { },
    onTriggerEvent: async ({ effect }) => {
        if (effect.setFollowersOnly === true) {
            const parsedDuration = TwitchCommandHelpers.getRawDurationInSeconds(effect.followersOnlyDuration, "minutes");

            await twitchApi.chat.setFollowerOnlyMode(effect.enableFollowersOnly ?? false, Math.floor(parsedDuration / 60));
        }

        if (effect.setSubscribersOnly === true) {
            await twitchApi.chat.setSubscriberOnlyMode(effect.enableSubscribersOnly ?? false);
        }

        if (effect.setEmoteOnly === true) {
            await twitchApi.chat.setEmoteOnlyMode(effect.enableEmoteOnly ?? false);
        }

        if (effect.setSlowMode === true) {
            await twitchApi.chat.setSlowMode(effect.enableSlowMode ?? false, effect.slowModeDelay);
        }
    }
}

module.exports = model;