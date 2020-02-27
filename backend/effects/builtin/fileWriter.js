"use strict";
const fileWriterProcessor = require("../../common/handlers/fileWriterProcessor");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

/**
 * The File Writer effect
 */
const fileWriter = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:filewriter",
        name: "Write To File",
        description: "Write or delete some text in a file.",
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

        <eos-container header="Write Mode" pad-top="true">
            <div class="controls-fb" style="padding-bottom: 5px;">
                <label class="control-fb control--radio">Replace   <tooltip text="'Replaces existing text with new text in the file.'"></tooltip>
                    <input type="radio" ng-model="effect.writeMode" value="replace"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Append <tooltip text="'Appends a new line with the given text to the file.'"></tooltip>
                    <input type="radio" ng-model="effect.writeMode" value="append"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Delete Line <tooltip text="'Deletes a specific line in the file.'"></tooltip>
                    <input type="radio" ng-model="effect.writeMode" value="delete"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Clear File <tooltip text="'Clears all text from the file.'"></tooltip>
                    <input type="radio" ng-model="effect.writeMode" value="delete-all"/>
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>

        <eos-container header="Append Options" pad-top="true" ng-if="effect.writeMode === 'append'">
            <label class="control-fb control--checkbox"> Don't Repeat <tooltip text="'Do not append a new line if the given text already exists in the file.'"></tooltip>
                <input type="checkbox" ng-model="effect.dontRepeat">
                <div class="control__indicator"></div>
            </label>
        </eos-container>

        <eos-container header="Delete Line Options" pad-top="true" ng-if="effect.writeMode === 'delete'">
            <div class="controls-fb" style="padding-bottom: 5px;">
                <label class="control-fb control--radio">Delete by line(s) <tooltip text="'Deletes line(s) at the specificed number(s)'"></tooltip>
                    <input type="radio" ng-model="effect.deleteLineMode" value="lines"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Delete by text <tooltip text="'Deletes lines that equal the given text'"></tooltip>
                    <input type="radio" ng-model="effect.deleteLineMode" value="text"/>
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>

        <eos-container header="Text" pad-top="true" ng-if="effect.writeMode === 'replace' || effect.writeMode === 'append' || (effect.writeMode === 'delete' && effect.deleteLineMode === 'text')">
            <input ng-model="effect.text" type="text" class="form-control" id="chat-text-setting" placeholder="Enter text" replace-variables>
        </eos-container>

        <eos-container header="Line Number(s)" pad-top="true" ng-if="effect.writeMode === 'delete' && effect.deleteLineMode === 'lines'">
            <p class="muted">Enter a line number or list of line numbers (separated by commas) to delete.</p>
            <input ng-model="effect.lineNumbers" type="text" class="form-control" id="chat-line-numbers-setting" placeholder="Enter line number(s)" replace-variables="number">
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: ($scope) => {
        if ($scope.effect.writeMode == null) {
            $scope.effect.writeMode = "replace";
        }

        if ($scope.effect.deleteLineMode == null) {
            $scope.effect.deleteLineMode = "lines";
        }
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.filepath == null || effect.filepath === "") {
            errors.push("Please select a text file to write to.");
        }
        if (effect.writeMode === 'delete' && (effect.deleteLineMode === 'lines' && (effect.lineNumbers == null || effect.lineNumbers === ""))) {
            errors.push("Please set the line number to be deleted.");
        }
        if (effect.writeMode === 'delete' && (effect.deleteLineMode === 'text' && (effect.text == null || effect.text === ""))) {
            errors.push("Please set the line text to be deleted.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async event => {
        await fileWriterProcessor.run(event.effect, event.trigger);
        return true;
    }
};

module.exports = fileWriter;
