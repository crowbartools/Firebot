"use strict";

const chatProcessor = require("../../common/handlers/chatProcessor");

const {
    EffectDependency,
    EffectTrigger
} = require("../models/effectModels");

/**
 * The Chat Effect
 */
const chat = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:chat",
        name: "Chat",
        description: "Sends a chat message.",
        tags: ["Chat", "Built in"],
        dependencies: [EffectDependency.CHAT],
        triggers: [EffectTrigger.ALL]
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
    <eos-chatter-select effect="effect" title="Chat as"></eos-chatter-select>

    <eos-container header="Message To Send" pad-top="true">
        <textarea ng-model="effect.message" class="form-control" name="text" placeholder="Enter message" rows="4" cols="40"></textarea>
        <div style="color:red" ng-if="effect.message && effect.message.length > 360">Chat messages cannot be longer than 360 characters. This message will get automatically trimmed if the length is still too long after all replace variables have been populated.</div>
        <div style="display: flex; flex-direction: row; width: 100%; height: 36px; margin: 10px 0 10px; align-items: center;">
            <label class="control-fb control--checkbox" style="margin: 0px 15px 0px 0px"> Whisper</tooltip>
                <input type="checkbox" ng-init="whisper = (effect.whisper != null && effect.whisper !== '')" ng-model="whisper" ng-click="effect.whisper = ''">
                <div class="control__indicator"></div>
            </label>
            <div ng-show="whisper">
                <div class="input-group">
                    <span class="input-group-addon" id="chat-whisper-effect-type">To</span>
                    <input ng-model="effect.whisper" type="text" class="form-control" id="chat-whisper-setting" aria-describedby="chat-text-effect-type" placeholder="Username">
                </div>
            </div>
        </div>   
    </eos-container>
    
    <eos-container>
        <eos-replace-variables></eos-replace-variables>
    </eos-container>

    `,
    /**
   * The controller for the front end Options
   */
    optionsController: () => {},
    /**
   * When the effect is triggered by something
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.message == null || effect.message === "") {
            errors.push("Chat message can't be blank.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise((resolve) => {
            chatProcessor.send(event.effect, event.trigger);
            resolve(true);
        });
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

module.exports = chat;
