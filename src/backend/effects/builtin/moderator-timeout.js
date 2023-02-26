"use strict";

const { EffectCategory, EffectDependency } = require('../../../shared/effect-constants');
const logger = require('../../logwrapper');
const twitchApi = require("../../twitch-api/api");

const model = {
    definition: {
        id: "firebot:modTimeout",
        name: "Timeout",
        description: "Timeout a user.",
        icon: "fad fa-user-clock",
        categories: [EffectCategory.COMMON, EffectCategory.MODERATION, EffectCategory.TWITCH],
        dependencies: [EffectDependency.CHAT]
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
    `,
    optionsController: () => {},
    optionsValidator: effect => {
        const errors = [];
        if (effect.username == null && effect.username !== "") {
            errors.push("Please enter a username.");
        }
        if (effect.time == null && (effect.time !== "" || effect.time < 0)) {
            errors.push("Please enter an amount of time.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        const user = await twitchApi.users.getUserByName(event.effect.username);

        if (user != null) {
            const result = await twitchApi.moderation.timeoutUser(user.id, event.effect.time);

            if (result === true) {
                logger.debug(`${event.effect.username} was timed out for ${event.effect.time}s via the timeout effect.`);
            } else {
                logger.error(`${event.effect.username} was unable to be timed out for ${event.effect.time}s via the timeout effect.`);
                return false;
            }
        } else {
            logger.warn(`User ${event.effect.username} does not exist and messages could not be purged via the Purge effect.`)
            return false;
        }

        return true;
    }
};

module.exports = model;
