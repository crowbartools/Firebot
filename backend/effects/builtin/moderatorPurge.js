"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger, EffectDependency } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const logger = require('../../logwrapper');
const chat = require("../../common/mixer-chat");

const moderatorBan = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:modpurge",
        name: "Purge",
        description: "Purge a users chat messages from chat.",
        icon: "fad fa-comment-slash",
        categories: [EffectCategory.COMMON, EffectCategory.MODERATION],
        dependencies: [EffectDependency.CHAT],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    /**
   * Global settings that will be available in the Settings tab
   */
    globalSettings: {},
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `
    <eos-container header="Target" pad-top="true">
        <div class="input-group">
            <span class="input-group-addon" id="username-type">Username</span>
            <input ng-model="effect.username" type="text" class="form-control" id="list-username-setting" aria-describedby="list-username-type" replace-variables>
        </div>
    </eos-container>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: () => {},
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.username == null && effect.username !== "") {
            errors.push("Please put in a username.");
        }
        return errors;
    },
    /**
   * When the effect is triggered do something
   */
    onTriggerEvent: async event => {
        chat.chatPurge(event.effect.username);
        logger.debug(event.effect.username + " was purged via the purge effect.");

        return true;
    },
    /**
   * Code to run in the overlay
   */
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        event: {}
    }
};

module.exports = moderatorBan;
