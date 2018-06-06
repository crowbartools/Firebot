"use strict";

const { ipcMain } = require("electron");

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

// Opens the firebot root folder
ipcMain.on("getEffectDefinitions", event => {
  event.returnValue = getEffectDefinitions();
});

exports.registerEffect = registerEffect;
exports.getEffectDefinitions = getEffectDefinitions;
exports.getEffectById = getEffectById;
