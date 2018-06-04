"use strict";

const EffectTrigger = {
  INTERACTIVE: "interactive",
  COMMAND: "command",
  CUSTOM_SCRIPT: "custom_script",
  API: "api",
  EVENT: "event",
  HOTKEY: "hotkey",
  TIMER: "timer",
  MANUAL: "manual"
};
EffectTrigger.ALL = Object.values(EffectTrigger);

const EffectDependency = {
  INTERACTIVE: "interactive",
  CHAT: "chat",
  CONSTELLATION: "constellation",
  OVERLAY: "overlay"
};

const _registeredEffects = [];

function registerEffect(effect) {
  // do some validation on the incoming effect
  _registeredEffects.push(effect);
}

function getEffectDefinitions() {
  return _registeredEffects.map(e => e.definition);
}

function getEffectById(id) {
  return _registeredEffects.filter(e => e.id === id);
}

exports.EffectTrigger = EffectTrigger;
exports.EffectDependency = EffectDependency;
exports.registerEffect = registerEffect;
exports.getEffectDefinitions = getEffectDefinitions;
exports.getEffectById = getEffectById;
