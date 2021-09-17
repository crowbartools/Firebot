"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');
const frontendCommunicator = require("../../common/frontend-communicator");

/** @type {import("../models/effectModels").Effect} */
const model = {
    definition: {
        id: "firebot:text-to-speech",
        name: "Text-To-Speech",
        description: "Have Firebot read out some text.",
        icon: "fad fa-microphone-alt",
        categories: [EffectCategory.FUN],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="Text">
            <textarea ng-model="effect.text" class="form-control" name="text" placeholder="Enter text" rows="4" cols="40" replace-variables menu-position="under"></textarea>
        </eos-container>

        <eos-container header="Voice" pad-top="true">
            <div class="dropdown">
                <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                    <span class="dropdown-text">{{getSelectedVoiceName()}}</span>
                    <span class="caret"></span>
                </button>
                <ul class="dropdown-menu">
                    <li><a href ng-click="effect.voiceId = 'default'">Default <tooltip text="'The default voice set in Settings > TTS'"></tooltip></a></li>
                    <li ng-repeat="voice in ttsVoices"><a href ng-click="effect.voiceId = voice.id">{{voice.name}}</a></li>
                </ul>
            </div>
        </eos-container>
    `,
    optionsController: ($scope, ttsService) => {
        if ($scope.effect.voiceId == null) {
            $scope.effect.voiceId = "default";
        }

        $scope.ttsVoices = ttsService.getVoices();

        $scope.getSelectedVoiceName = () => {
            let voiceId = $scope.effect.voiceId;
            if (voiceId === "default" || voiceId == null) {
                return "Default";
            }

            let voice = ttsService.getVoiceById(voiceId);

            return voice ? voice.name : "Unknown Voice";
        };
    },
    optionsValidator: effect => {
        let errors = [];
        if (effect.text == null || effect.text.length < 1) {
            errors.push("Please input some text.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        let effect = event.effect;

        frontendCommunicator.send("read-tts", {
            text: effect.text,
            voiceId: effect.voiceId
        });

        return true;
    }
};

module.exports = model;
