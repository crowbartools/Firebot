"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");

const _registeredEffects = [];

function registerEffect(effect) {
  // do some validation on the incoming effect
  _registeredEffects.push(effect);
  logger.debug(`Registered Effect ${effect.definition.id}`);
}

function getEffectDefinitions() {
  return _registeredEffects.map(e => e.definition);
}

function getEffectById(id) {
  return _registeredEffects.find(e => e.definition.id === id);
}

function getEffectOverlayExtensions() {
  return _registeredEffects.map(e => {
    return {
      id: e.definition.id,
      dependencies: e.overlayExtension.dependencies,
      event: e.overlayExtension.event
    };
  });
}

function mapEffectForFrontEnd(e) {
  if (!e) return {};
  return {
    definition: e.definition,
    optionsTemplate: e.optionsTemplate,
    optionsTemplateUrl: e.optionsTemplateUrl,
    optionsControllerRaw: e.optionsController
      ? e.optionsController.toString()
      : "() => {}"
  };
}

ipcMain.on("getAllEffectDefinitions", event => {
  logger.info("got get all effects request");
  let mapped = _registeredEffects.map(mapEffectForFrontEnd);
  event.returnValue = mapped;
});

ipcMain.on("getEffectDefinition", (event, effectId) => {
  logger.info("got effect request", effectId);
  event.returnValue = mapEffectForFrontEnd(getEffectById(effectId));
});

exports.registerEffect = registerEffect;
exports.getEffectDefinitions = getEffectDefinitions;
exports.getEffectById = getEffectById;
exports.getEffectOverlayExtensions = getEffectOverlayExtensions;
