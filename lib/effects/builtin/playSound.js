"use strict";

const {
  EffectDefinition,
  EffectDependency,
  EffectTrigger
} = require("../models/effectModels");

/**
 * The Play Sound effect
 * @module playSound
 * @type {Effect}
 */

exports = {
  definition: {
    id: "firebot:playsound",
    name: "Play Sound",
    description: "Plays a sound effect",
    tags: ["Firebot", "Fun"],
    dependenies: [EffectDependency.CHAT],
    triggers: [EffectTrigger.ALL]
  },
  optionsTemplate: `
    <eos-container header="What sound should I play?">
      <file-chooser model="effect.file" options="{ filters: [ {name: 'Audio', extensions: ['mp3', 'ogg', 'wav', 'flac']} ]}"></file-chooser>
    </eos-container>

    <eos-container header="How loud should it be?">
      <div class="volume-slider-wrapper">
          <i class="fal fa-volume-down volume-low"></i>
          <rzslider rz-slider-model="effect.volume" rz-slider-options="{floor: 1, ceil: 10, hideLimitLabels: true}"></rzslider>
          <i class="fal fa-volume-up volume-high"></i>
      </div>
    </eos-container>

    <eos-audio-output-device effect="effect"></eos-audio-output-device>
    `,
  optionsController: ($scope, listenerService) => {
    if ($scope.effect.volume == null) {
      $scope.effect.volume = 5;
    }

    $scope.openFileExporer = function() {
      let registerRequest = {
        type: listenerService.ListenerType.SOUND_FILE,
        runOnce: true,
        publishEvent: true
      };
      listenerService.registerListener(registerRequest, filepath => {
        $scope.effect.file = filepath;
      });
    };
  },
  onTriggerEvent: event => {
    // when the effect is triggered by a button, command, timer, etc
  },
  overlayExtension: {}
};
