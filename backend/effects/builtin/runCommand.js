"use strict";

const effectRunner = require("../../common/effect-runner");
const commandAccess = require("../../chat/commands/command-access");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

/**
 * The Delay effect
 */
const model = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:runcommand",
        name: "Run Command",
        description: "Runs effects saved for the selected custom command.",
        icon: "fad fa-exclamation-square",
        categories: [EffectCategory.ADVANCED],
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
        <eos-container header="Command To Run">
            <ui-select ng-model="effect.commandId" theme="bootstrap">
                <ui-select-match placeholder="Select or search for a command... ">{{$select.selected.trigger}}</ui-select-match>
                <ui-select-choices repeat="command.id as command in commands | filter: { trigger: $select.search }" style="position:relative;">
                    <div ng-bind-html="command.trigger | highlight: $select.search"></div>
                </ui-select-choices>
            </ui-select>
        </eos-container>

        <eos-container>
            <div class="effect-info alert alert-info">
                Please keep in mind you may get unexpected results if any effects in the selected command have command specific things (such as $arg variables) when running outide the context of a chat event.
            </div>
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: ($scope, commandsService) => {
        $scope.commands = commandsService.getCustomCommands();
    },
    /**
   * When the effect is saved
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.commandId == null || effect.commandId === "") {
            errors.push("Please select a command to run.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise(resolve => {
            let effect = event.effect;

            let command = commandAccess.getCustomCommand(effect.commandId);
            if (command && command.effects) {
                let processEffectsRequest = {
                    trigger: event.trigger,
                    effects: command.effects
                };

                effectRunner.processEffects(processEffectsRequest).then(() => {
                    resolve(true);
                });
            }

            resolve(true);
        });
    }
};

module.exports = model;
