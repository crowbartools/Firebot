"use strict";

const controlProcessor = require("../../common/handlers/controlEmulation/controlProcessor");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

/** @type {import("../models/effectModels").Effect} */
const controlEmulation = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:controlemulation",
        name: "Control Emulation",
        description: "Emulate keyboard keys or mouse clicks",
        icon: "fad fa-keyboard",
        categories: [EffectCategory.ADVANCED, EffectCategory.FUN],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT, InputEvent.MOUSEUP, InputEvent.KEYUP],
            EffectTrigger.ALL
        )
    },
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `
    <eos-container header="Key To Press">
        <div class="input-group game-press">
            <span class="input-group-addon" id="button-press-effect-type">Press</span>
            <input type="text" ng-model="effect.press" uib-typeahead="control for control in validControls | filter:$viewValue | limitTo:8" class="form-control" id="game-control-press-setting" aria-describedby="button-press-effect-type">
        </div>
    </eos-container>

    <eos-container header="Modifiers" pad-top="true">
        <div class="button-press-modifier-effect-type" style="padding-left: 15px;">
            <label ng-repeat="modifier in validModifiers" class="control-fb control--checkbox">{{modifier}}
                <input type="checkbox" ng-click="modifierArray(effect.modifiers,modifier)" ng-checked="modifierCheckboxer(effect.modifiers,modifier)"  aria-label="..." >
                <div class="control__indicator"></div>
            </label>
        </div>
    </eos-container>

    <eos-container header="Opposite Key" pad-top="true">
        <p>Use when this key is meant to control movement in a game. IE if "W" is forward, "S" might be the opposite. If more people are pressing "W", then that will be used. If more are pressing "S", then that is used. This ensures movement doesn't get completely locked.</p>
        <div class="input-group game-opposite">
            <span class="input-group-addon" id="opposite-button-effect-type">Opposite</span>
            <input type="text" ng-model="effect.opposite" uib-typeahead="control for control in validControls | filter:$viewValue | limitTo:8" class="form-control" id="game-control-opposite-setting" aria-describedby="opposite-button-effect-type">
        </div>
    </eos-container>

    <eos-container header="Hold Key" pad-top="true">
        <div class="btn-group">
            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="holding-button-effect-type">{{effect.holding ? effect.holding : 'No'}}</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu holding-button-effect-dropdown">
                <li ng-click="effect.holding = 'No'"><a href>No</a></li>
                <li ng-click="effect.holding = 'Yes'"><a href>Yes</a></li>
            </ul>
        </div>
        <p style="padding-top:5px;"><strong>Yes</strong>: The key will be held as long as the button is pressed on Mixer by one or more viewers.<br><br><strong>No</strong>: A "press and release" will be simulated for the key, regardless of how long the button is held by viewers.</p>
    </eos-container>

    <eos-container>
        <div class="effect-info alert alert-info">
            Game controls do not work in every game or with every program. These are emulated controls. If the controls aren't working on your game or app try changing the emulator in the app settings.
        </div>
    </eos-container>

    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: ($scope, effectHelperService) => {
        $scope.validControls = [
            "a",
            "b",
            "c",
            "d",
            "e",
            "f",
            "g",
            "h",
            "i",
            "j",
            "k",
            "l",
            "m",
            "n",
            "o",
            "p",
            "q",
            "r",
            "s",
            "t",
            "u",
            "v",
            "w",
            "x",
            "y",
            "z",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "0",
            "backspace",
            "delete",
            "enter",
            "space",
            "tab",
            "escape",
            "up",
            "down",
            "left",
            "right",
            "home",
            "end",
            "pageup",
            "pagedown",
            "f1",
            "f2",
            "f3",
            "f4",
            "f5",
            "f6",
            "f7",
            "f8",
            "f9",
            "f10",
            "f11",
            "f12",
            "alt",
            "control",
            "shift",
            "numpad_0",
            "numpad_1",
            "numpad_2",
            "numpad_3",
            "numpad_4",
            "numpad_5",
            "numpad_6",
            "numpad_7",
            "numpad_8",
            "numpad_9",
            "leftmouse",
            "middlemouse",
            "rightmouse",
            "audio_mute",
            "audio_vol_down",
            "audio_vol_up",
            "audio_play",
            "audio_stop",
            "audio_pause",
            "audio_prev",
            "audio_next"
        ];

        $scope.validModifiers = ["Control", "Alt", "Shift"];

        // This sets the effect.modifier to an array of checked items.
        $scope.modifierArray = function(list, item) {
            $scope.effect.modifiers = effectHelperService.getCheckedBoxes(list, item);
        };

        // This checks if an item is in the effect.modifier array and returns true.
        // This allows us to check boxes when loading up this button effect.
        $scope.modifierCheckboxer = function(list, item) {
            return effectHelperService.checkSavedArray(list, item);
        };
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.press == null) {
            errors.push("Please select a control to press.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async event => {
        controlProcessor.press(event.trigger.metadata.inputType, event.effect);
        return true;
    }
};

module.exports = controlEmulation;
