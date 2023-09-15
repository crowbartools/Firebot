"use strict";

const { emulateKeyPress, typeString } = require("../../common/handlers/controlEmulation/emulate-control");
const { EffectCategory } = require('../../../shared/effect-constants');

const effect = {
    definition: {
        id: "firebot:controlemulation",
        name: "Emulate Control",
        description: "Emulate keyboard keys or mouse clicks",
        icon: "fad fa-keyboard",
        categories: [EffectCategory.ADVANCED, EffectCategory.FUN],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
    <eos-container header="Mode">
        <dropdown-select options="{ keyPress: 'Key Press', typeString: 'Type Text'}" selected="effect.mode"></dropdown-select>
    </eos-container>

    <div ng-if="effect.mode == 'typeString'">
        <eos-container header="Text To Type" pad-top="true">
            <firebot-input placeholder-text="Input text" model="effect.text" />
        </eos-container>
    </div>

    <div ng-if="effect.mode == 'keyPress'">
        <eos-container header="Key To Press" pad-top="true">
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

        <eos-container header="Press Duration" pad-top="true">
            <firebot-input model="effect.pressDuration" input-title="Secs" data-type="number" placeholder-text="Optional" />
            <p style="padding-top:5px;">How many seconds should the control be pressed for (Can be a decimal). Defaults to 0.03s if left blank.</p>
        </eos-container>
    </div>


    <eos-container>
        <div class="effect-info alert alert-info">
            Please keep in mind emulated controls may not work in every game or program. If the controls aren't working for a game/app, try running either Firebot or the game/app with Administrator privileges. 
        </div>
    </eos-container>

    `,
    optionsController: ($scope, effectHelperService) => {

        if ($scope.effect.mode == null) {
            $scope.effect.mode = "keyPress";
        }

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
            "printscreen",
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
            "f13",
            "f14",
            "f15",
            "f16",
            "f17",
            "f18",
            "f19",
            "f20",
            "f21",
            "f22",
            "f23",
            "f24",
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

        $scope.validModifiers = ["Control", "Alt", "Shift", "Windows Key/Command"];

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
    optionsValidator: effect => {
        const errors = [];
        if (effect.mode === "keyPress") {
            if (effect.press == null) {
                errors.push("Please select a control to press.");
            }
            if (effect.pressDuration != null && !isNaN(effect.pressDuration) && parseFloat(effect.pressDuration) <= 0) {
                errors.push("Press duration must be greater than 0 or left blank.");
            }
        }
        if (effect.mode === "typeString" && (effect.text == null || effect.text.length < 1)) {
            errors.push("Please provide text to type");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect }) => {
        if (effect.mode == null || effect.mode === "keyPress") {
            emulateKeyPress(effect.press, effect.modifiers, effect.pressDuration);
        } else if (effect.mode === "typeString") {
            typeString(effect.text);
        }
        return true;
    }
};

module.exports = effect;
