import type { EffectType } from "../../../types/effects";
import { TwitchApi } from "../../streaming-platforms/twitch/api";
import logger from '../../logwrapper';

const effect: EffectType<{
    username: string;
    time: number;
    reason: string;
}> = {
    definition: {
        id: "firebot:modTimeout",
        name: "Timeout",
        description: "Timeout a user.",
        icon: "fad fa-user-clock",
        categories: ["common", "moderation", "twitch"],
        dependencies: ["chat"]
    },
    optionsTemplate: `
        <eos-container header="Target" pad-top="true">
            <div class="input-group">
                <span class="input-group-addon" id="username-type">Username</span>
                <input ng-model="effect.username" type="text" class="form-control" id="list-username-setting" aria-describedby="list-username-type" replace-variables menu-position="below">
            </div>
        </eos-container>

        <eos-container header="Time" pad-top="true">
            <div class="input-group">
                <span class="input-group-addon" id="time-type">Time (Seconds)</span>
                <input ng-model="effect.time" type="text" class="form-control" id="list-username-setting" aria-describedby="list-time-type" placeholder="Seconds" replace-variables="number">
            </div>
        </eos-container>

        <eos-container header="Reason" pad-top="true">
            <firebot-input
                input-title="Reason"
                placeholder-text="Timed out by Firebot"
                model="effect.reason"
            />
        </eos-container>
    `,
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.username == null && effect.username !== "") {
            errors.push("Please enter a username.");
        }
        if (effect.time == null && (effect.time.toString() !== "" || effect.time < 0)) {
            errors.push("Please enter an amount of time.");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect }) => {
        const user = await TwitchApi.users.getUserByName(effect.username);

        if (user != null) {
            const reason = effect.reason?.length ? effect.reason : "Timed out by Firebot";
            const result = await TwitchApi.moderation.timeoutUser(user.id, effect.time, reason);

            if (result === true) {
                logger.debug(`${effect.username} was timed out for ${effect.time}s via the timeout effect.`);
            } else {
                logger.error(`${effect.username} was unable to be timed out for ${effect.time}s via the timeout effect.`);
                return false;
            }
        } else {
            logger.warn(`User ${effect.username} does not exist and messages could not be purged via the Purge effect.`);
            return false;
        }

        return true;
    }
};

export = effect;