"use strict";

const effectManager = require("./effectManager");

exports.loadEffects = () => {
  // get effect definitions
  const playSoundEffect = require("./builtin/playSound");
  const chatEffect = require("./builtin/chat");
  const api = require("./builtin/api");
  const celebration = require("./builtin/celebration");
  const cooldowns = require("./builtin/cooldowns");
  const dice = require("./builtin/dice");
  const fileWriter = require("./builtin/fileWriter");
  const html = require("./builtin/html");
  const playVideo = require("./builtin/playVideo");
  const showEvent = require("./builtin/showEvents");
  const controlEmulation = require("./builtin/controlEmulation");

  // register them
  effectManager.registerEffect(playSoundEffect);
  effectManager.registerEffect(chatEffect);
  effectManager.registerEffect(api);
  effectManager.registerEffect(celebration);
  effectManager.registerEffect(cooldowns);
  effectManager.registerEffect(dice);
  effectManager.registerEffect(fileWriter);
  effectManager.registerEffect(html);
  effectManager.registerEffect(playVideo);
  effectManager.registerEffect(showEvent);
  effectManager.registerEffect(controlEmulation);
};
