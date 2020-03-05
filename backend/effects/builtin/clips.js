"use strict";

const clipProcessor = require("../../common/handlers/createClipProcessor");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

const accountAccess = require("../../common/account-access");

const { EffectCategory } = require('../../../shared/effect-constants');

/**
 * The Clip effect
 */
const clip = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:clip",
        name: "Create Clip",
        description: "Creates a clip on Mixer.",
        hidden: !accountAccess.getAccounts().streamer.loggedIn || !accountAccess.getAccounts().streamer.partnered,
        icon: "fad fa-film",
        categories: [EffectCategory.COMMON, EffectCategory.FUN],
        dependencies: [EffectDependency.CHAT, EffectDependency.CONSTELLATION],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN],
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
        <eos-container header="Clip Title" pad-top="true">
            <p>The title for the new clip (Leave blank to default to current stream title).</p>
            <input ng-model="effect.clipTitle" type="text" class="form-control" placeholder="Enter text" replace-variables>
        </eos-container>

        <eos-container>
            <div style="padding-top:15px">
                <label class="control-fb control--checkbox"> Post clip link in chat
                    <input type="checkbox" ng-model="effect.postLink">
                    <div class="control__indicator"></div>
                </label>
            </div>

            <div style="padding-top:15px">
                <label class="control-fb control--checkbox"> Download clip <tooltip text="'You can change which folder clips save to in the Settings tab.'"></tooltip>
                    <input type="checkbox" ng-model="effect.download">
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>

        <eos-container>
            <div class="effect-info alert alert-warning">
                Note: You must be live for this effect to work.
            </div>
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: ($scope, listenerService) => {
    // The name of the api and if it has images available to show or not.

    },
    /**
   * When the effect is triggered by something
   */
    optionsValidator: effect => {
        let errors = [];
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async event => {
        clipProcessor.createClip(event.effect, event.trigger);
        return true;
    }
};

module.exports = clip;
