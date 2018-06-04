"use strict";

const {
  EffectDependency,
  EffectTrigger,
  registerEffect
} = require("./../effectManager");

const effect = {
  definition: {
    id: "firebot:playsound",
    name: "Play Sound",
    description: "Plays a sound effect",
    tags: ["Firebot", "Fun"],
    dependenies: [EffectDependency.CHAT],
    triggers: EffectTrigger.ALL
  },
  optionsTemplate: `
      <div>
        <!-- options html here for use in the front end, can have angular bindings and whatnot -->
      </div>
    `,
  optionsTemplateUrl: "./something/play_sound.html", // alternative to optionsTemplate
  optionsController: $scope => {
    // do some angular stuff
  },
  onTrigger: runRequest => {
    // when the effect is triggered by a button, command, timer, etc
  },
  overlayExtension: {}
};

registerEffect(effect);
