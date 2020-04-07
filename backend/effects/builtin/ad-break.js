"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;
const { EffectCategory } = require('../../../shared/effect-constants');

const accountAccess = require("../../common/account-access");

const channelAccess = require("../../common/channel-access");

const model = {
    definition: {
        id: "firebot:ad-break",
        name: "Ad Break",
        description: "Trigger an ad-break",
        hidden: !accountAccess.getAccounts().streamer.loggedIn || !accountAccess.getAccounts().streamer.partnered,
        icon: "fad fa-ad",
        categories: [EffectCategory.COMMON],
        dependencies: [EffectDependency.CHAT],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN],
            EffectTrigger.ALL
        )
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container>
            <p>This effect triggers an ad-break. Ad-breaks are a single ad up to 30s long. Ad-breaks can be triggered up to two times every 15 minutes. Ad-Breaks can only be triggered if you are live and it is NOT supported during co-streams or while hosting a channel.</p>
        </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: () => {
        return [];
    },
    onTriggerEvent: async () => {

        try {
            await channelAccess.triggerAdBreak();
        } catch (error) {
            renderWindow.webContents.send("error", `Failed to trigger ad-break because: ${error.message}`);
        }

        return true;
    }
};

module.exports = model;
