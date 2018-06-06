"use strict";

const effectManager = require("./effectManager");

exports.loadEffects = () => {
  // get effect definitions
  const playSoundEffect = require("./builtin/playSound");

  // register them
  effectManager.registerEffect(playSoundEffect);
};
