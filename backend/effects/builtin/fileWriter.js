"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const fileWriterProcessor = require("../../common/handlers/fileWriterProcessor");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

/**
 * The File Writer effect
 */
const fileWriter = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:filewriter",
        name: "Write to file",
        description: "Write some text to a file.",
        tags: ["Built in"],
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
  <eos-container header="File">
        <file-chooser model="effect.filepath" options="{ filters: [ {name:'Text',extensions:['txt']} ]}"></file-chooser>
        </eos-container>

        <eos-container header="Text" pad-top="true">
        <input ng-model="effect.text" type="text" class="form-control" id="chat-text-setting" placeholder="Enter text" replace-variables>
        </eos-container>

        <eos-container header="Write Mode">
        <div class="controls-fb-inline" style="padding-bottom: 5px;">
            <label class="control-fb control--radio">Replace
                <input type="radio" ng-model="effect.writeMode" value="replace"/> 
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--radio">Append
                <input type="radio" ng-model="effect.writeMode" value="append"/>
                <div class="control__indicator"></div>
            </label>
        </div>
    </eos-container>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: ($scope, listenerService) => {},
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.text == null) {
            errors.push("Please enter some text to put into the file.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise((resolve, reject) => {
            // What should this do when triggered.
            fileWriterProcessor.run(event.effect, event.trigger);
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
        event: {
            name: "filewriter",
            onOverlayEvent: event => {
                console.log("yay file writer");
                //need to implement this
            }
        }
    }
};

module.exports = fileWriter;
