"use strict";

const effectManager = require("./effectManager");

exports.loadEffects = () => {
  // get effect definitions
  const playSoundEffect = require("./builtin/playSound");
  const chatEffect = require("./builtin/chat");

  // register them
  effectManager.registerEffect(playSoundEffect);
  effectManager.registerEffect(chatEffect);
};
