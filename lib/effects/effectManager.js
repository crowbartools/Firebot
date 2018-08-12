"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
let EventEmitter = require("events");

class EffectManager extends EventEmitter {
    constructor() {
        super();
        this._registeredEffects = [];
    }

    registerEffect(effect) {
    // do some validation on the incoming effect
        this._registeredEffects.push(effect);

        logger.debug(`Registered Effect ${effect.definition.id}`);

        this.emit("effectRegistered", effect);
    }

    getEffectDefinitions() {
        return this._registeredEffects.map(e => e.definition);
    }

    getEffectById(id) {
        return this._registeredEffects.find(e => e.definition.id === id);
    }

    getEffectOverlayExtensions() {
        return this._registeredEffects
            .filter(e => e.overlayExtension != null)
            .map(e => {
                return {
                    id: e.definition.id,
                    dependencies: e.overlayExtension.dependencies,
                    event: e.overlayExtension.event
                };
            });
    }

    mapEffectForFrontEnd(e) {
        if (!e) return {};
        return {
            definition: e.definition,
            optionsTemplate: e.optionsTemplate,
            optionsTemplateUrl: e.optionsTemplateUrl,
            optionsControllerRaw: e.optionsController
                ? e.optionsController.toString()
                : "() => {}",
            optionsValidatorRaw: e.optionsValidator
                ? e.optionsValidator.toString()
                : "() => {return [];}"
        };
    }
}

const manager = new EffectManager();

ipcMain.on("getAllEffectDefinitions", event => {
    logger.info("got get all effects request");
    let mapped = manager._registeredEffects.map(manager.mapEffectForFrontEnd);
    event.returnValue = mapped;
});

ipcMain.on("getEffectDefinition", (event, effectId) => {
    logger.info("got effect request", effectId);
    event.returnValue = manager.mapEffectForFrontEnd(
        manager.getEffectById(effectId)
    );
});

module.exports = manager;
