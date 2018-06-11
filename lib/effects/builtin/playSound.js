"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");

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
const playSound = {
  /**
   * The definition of the Effect
   */
  definition: {
    id: "firebot:playsound",
    name: "Play Sound",
    description: "Plays a sound effect",
    tags: ["Fun", "Built in"],
    dependenies: [EffectDependency.CHAT],
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
    <eos-container header="What sound should I play?">
      <file-chooser model="effect.filepath" options="{ filters: [ {name: 'Audio', extensions: ['mp3', 'ogg', 'wav', 'flac']} ]}"></file-chooser>
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
  /**
   * The controller for the front end Options
   */
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
  /**
   * When the effect is triggered by something
   */
  optionsValidator: effect => {
    let errors = [];
    if (effect.filepath != null) {
      errors.push("Please select a sound file.");
    }
    return errors;
  },
  /**
   * When the effect is triggered by something
   */
  onTriggerEvent: event => {
    return new Promise((resolve, reject) => {
      let effect = event.effect;
      let data = {
        filepath: effect.filepath,
        volume: effect.volume
      };

      let selectedOutputDevice = effect.audioOutputDevice;
      if (
        selectedOutputDevice == null ||
        selectedOutputDevice.label === "App Default"
      ) {
        selectedOutputDevice = settings.getAudioOutputDevice();
      }
      data.audioOutputDevice = selectedOutputDevice;

      if (selectedOutputDevice.deviceId === "overlay") {
        let resourceToken = resourceTokenManager.storeResourcePath(
          effect.filepath,
          30
        );
        data.resourceToken = resourceToken;
      }

      // Send data back to media.js in the gui.
      renderWindow.webContents.send("playsound", data);
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
      name: "sound",
      onOverlayEvent: event => {
        console.log("yay play sound");
      }
    }
    // Not implemented yet
  }
};

module.exports = playSound;
