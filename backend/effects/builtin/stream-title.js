"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');
const twitchClient = require("../../twitch-api/client");
const { TwitchAPICallType } = require('twitch/lib');
const accountAccess = require("../../common/account-access");

/** @type {import("../models/effectModels").Effect} */
const model = {
    definition: {
        id: "firebot:streamtitle",
        name: "Set Stream Title",
        description: "Set the title of the stream.",
        icon: "fad fa-comment-dots",
        categories: [EffectCategory.COMMON, EffectCategory.MODERATION],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="New Title" pad-top="true">
            <input ng-model="effect.title" class="form-control" type="text" placeholder="Enter text" replace-variables menu-position="below">
            <p ng-show="trigger == 'command'" class="muted" style="font-size:11px;margin-top:6px;"><b>ProTip:</b> Use <b>$arg[all]</b> to include every word after the command !trigger.</p>
        </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: effect => {
        let errors = [];
        if (effect.title == null) {
            errors.push("Please input the title you'd like to use for the stream.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        const client = twitchClient.getClient();

        await client.callApi({
            type: TwitchAPICallType.Helix,
            method: "PATCH",
            url: "channels",
            query: {
                "broadcaster_id": accountAccess.getAccounts().streamer.userId,
                "title": event.effect.title
            }
        });
        return true;
    }
};

module.exports = model;
