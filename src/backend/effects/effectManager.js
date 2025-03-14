"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const EventEmitter = require("events");
const { EffectTrigger } = require("../../shared/effect-constants");
const frontendCommunicator = require("../common/frontend-communicator");
const cloudSync = require("../cloud-sync/cloud-sync");

class EffectManager extends EventEmitter {
    constructor() {
        super();
        this._registeredEffects = [];
    }

    registerEffect(effect) {
        if (this._registeredEffects.some(e => e?.definition?.id === effect.definition.id)) {
            logger.warn(`Attempted to register duplicate effect: ${effect.definition.id}.`);
            return;
        }

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
            .filter(e => {
                return e.overlayExtension != null &&
                    e.overlayExtension.event != null &&
                    e.overlayExtension.event.onOverlayEvent != null &&
                    e.overlayExtension.event.name != null &&
                    e.overlayExtension.event.name !== "";
            })
            .map(e => {
                return {
                    id: e.definition.id,
                    dependencies: e.overlayExtension.dependencies,
                    event: e.overlayExtension.event
                };
            });
    }

    /**
     *
     * @param {import("../../types/effects").EffectType<unknown>} e
     * @returns
     */
    mapEffectForFrontEnd(e) {
        if (!e) {
            return {};
        }

        let hidden = e.definition.hidden;

        // If hidden is not manually defined, check if dependencies are met
        if (
            hidden == null &&
            e.definition.dependencies &&
            !e.definition.showWhenDependenciesNotMet
        ) {
            // require here to avoid circular dependency issues :(
            const { checkEffectDependencies } = require("./effect-helpers");
            hidden = !checkEffectDependencies(e.definition.dependencies, "display");
        }

        // Create a copy of the def with an evaluated hidden prop
        const definition = {
            ...e.definition,
            hidden: typeof hidden === "function"
                ? hidden()
                : hidden
        };

        return {
            definition: definition,
            optionsTemplate: e.optionsTemplate,
            optionsTemplateUrl: e.optionsTemplateUrl,
            optionsControllerRaw: e.optionsController
                ? e.optionsController.toString()
                : "() => {}",
            optionsValidatorRaw: e.optionsValidator
                ? e.optionsValidator.toString()
                : "() => {return [];}",
            getDefaultLabelRaw: e.getDefaultLabel
                ? e.getDefaultLabel.toString()
                : undefined
        };
    }

    clearFilePaths(effects) {
        if (effects == null) {
            return effects;
        }

        const keys = Object.keys(effects);

        for (const key of keys) {
            const value = effects[key];

            if (key != null && key.toLowerCase() === "filepath" || key.toLowerCase() === "file") {
                effects[key] = undefined;
            } else if (value && typeof value === "object") {
                effects[key] = this.clearFilePaths(value);
            }
        }

        return effects;
    }
}

const manager = new EffectManager();


frontendCommunicator.onAsync("getEffectsShareCode", async (effectList) => {
    logger.debug("got get effects share code request");

    effectList = manager.clearFilePaths(effectList);

    //return share code
    return await cloudSync.sync({ effects: effectList });
});

frontendCommunicator.onAsync("getAllEffectDefinitions", async () => {
    logger.debug("got get all effects request");
    const mapped = manager._registeredEffects.map(manager.mapEffectForFrontEnd);
    return mapped;
});

frontendCommunicator.onAsync("getEffectDefinitions", async (triggerData) => {
    logger.debug("got get effects def request");
    const effects = manager._registeredEffects;

    const triggerType = triggerData.triggerType,
        triggerMeta = triggerData.triggerMeta;

    const filteredEffectDefs = effects
        .map(manager.mapEffectForFrontEnd)
        .map(e => e.definition)
        .filter(e => {
            if (triggerType != null) {
                if (e.triggers == null) {
                    return true;
                }
                const supported = e.triggers[triggerType] != null && e.triggers[triggerType] !== false;
                if (!supported) {
                    return false;
                }

                if (triggerMeta) {
                    const effectTriggerData = e.triggers[triggerType];

                    switch (triggerType) {
                        case EffectTrigger.EVENT:
                            if (effectTriggerData === true) {
                                return true;
                            }
                            if (Array.isArray(effectTriggerData)) {
                                return effectTriggerData.includes(triggerMeta.triggerId);
                            }
                            return true;
                        default:
                            return true;
                    }
                } else {
                    return true;
                }
            }
            return true;
        });

    return filteredEffectDefs;
});

ipcMain.on("getEffectDefinition", (event, effectId) => {
    logger.debug("got effect request", effectId);
    event.returnValue = manager.mapEffectForFrontEnd(
        manager.getEffectById(effectId)
    );
});

module.exports = manager;
