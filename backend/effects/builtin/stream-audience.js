"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const channelAccess = require("../../common/channel-access");

const streamAudience = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:streamaudience",
        name: "Set Stream Audience",
        description: "Set the audience rating for the stream.",
        icon: "fad fa-users",
        categories: [EffectCategory.COMMON, EffectCategory.MODERATION],
        dependencies: [],
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
    <eos-container header="Audience" pad-top="true">
        <div class="btn-group">
            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="list-effect-type">{{effect.audience ? effect.audience : 'Pick one'}}</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu celebrate-effect-dropdown">
                <li ng-click="effect.audience = 'Family'">
                    <a href>Family</a>
                </li>
                <li ng-click="effect.audience = 'Teen'">
                    <a href>Teen</a>
                </li>
                <li ng-click="effect.audience = '18+'">
                    <a href>18+</a>
                </li>
            </ul>
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
        if (effect.audience == null) {
            errors.push("Please select an audience.");
        }
        return errors;
    },
    /**
   * When the effect is triggered do something
   */
    onTriggerEvent: async event => {
        let audience = event.effect.audience.toLowerCase();
        await channelAccess.setStreamerAudience(audience);
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

module.exports = streamAudience;
