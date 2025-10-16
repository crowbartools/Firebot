"use strict";

const EventEmitter = require("events");
const { EffectTrigger } = require("../../shared/effect-constants");
const cloudSync = require("../cloud-sync");
const frontendCommunicator = require("../common/frontend-communicator");
const logger = require("../logwrapper");

class EffectManager extends EventEmitter {
    /**
     * @type {Record<string, Array<{ eventSourceId: string, eventId: string }>>}
     */
    additionalEffectEvents = {};

    constructor() {
        super();
        /**
         * @type {import("../../types/effects").EffectType[]}
         */
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

    unregisterEffect(effectId) {
        const effect = this._registeredEffects.find(e => e?.definition?.id === effectId);
        if (!effect) {
            logger.warn(`Effect ${effectId} does not exist`);
            return;
        }

        const hasOverlayEffect = !!effect.overlayExtension;

        this._registeredEffects = this._registeredEffects.filter(e => e?.definition?.id !== effectId);

        logger.debug(`Unregistered Effect ${effectId}`);

        this.emit("effectUnregistered", { effectId, hasOverlayEffect });
    }

    getEffectDefinitions() {
        return this._registeredEffects.map(e => e.definition);
    }

    getEffectById(id) {
        return this._registeredEffects.find(e => e.definition.id === id);
    }

    getEffectOverlayExtensions() {
        return this._registeredEffects
            .filter((e) => {
                return e.overlayExtension != null &&
                    e.overlayExtension.event != null &&
                    e.overlayExtension.event.onOverlayEvent != null &&
                    e.overlayExtension.event.name != null &&
                    e.overlayExtension.event.name !== "";
            })
            .map((e) => {
                return {
                    id: e.definition.id,
                    dependencies: e.overlayExtension.dependencies,
                    event: e.overlayExtension.event
                };
            });
    }

    getEffectsForEvent(eventSourceId, eventId) {
        const effects = this.getEffectDefinitions()
            .filter((e) => {
                if (!e.triggers) {
                    return true;
                }
                const trigger = e.triggers["event"];
                return trigger === true
                    || (Array.isArray(trigger)
                        && trigger.some(e => e === `${eventSourceId}:${eventId}`));
            });
        return effects;
    }

    addEventToEffect(effectId, eventSourceId, eventId) {
        if (this.getEffectsForEvent(eventSourceId, eventId).some(e => e.id === effectId)
            || this.additionalEffectEvents[effectId]?.some(e => e.eventSourceId === eventSourceId && e.eventId === eventId)) {
            logger.warn(`Effect ${effectId} already setup for event ${eventSourceId}:${eventId}`);
            return;
        }

        const additionalEvents = this.additionalEffectEvents[effectId] ?? [];

        additionalEvents.push({ eventSourceId, eventId });

        this.additionalEffectEvents[effectId] = additionalEvents;

        logger.debug(`Added event ${eventSourceId}:${eventId} to effect ${effectId}`);
    }

    removeEventFromEffect(effectId, eventSourceId, eventId) {
        let additionalEvents = this.additionalEffectEvents[effectId] ?? [];

        if (!additionalEvents.some(e => e.eventSourceId === eventSourceId && e.eventId === eventId)) {
            logger.warn(`Effect ${effectId} does not have a plugin registration for event ${eventSourceId}:${eventId}`);
            return;
        }

        additionalEvents = additionalEvents.filter(e => e.eventSourceId !== eventSourceId && e.eventId !== eventId);
        this.additionalEffectEvents[effectId] = additionalEvents;

        logger.debug(`Removed event ${eventSourceId}:${eventId} from effect ${effectId}`);
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
        .filter((e) => {
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
                                const additionalEffectEvents = (manager.additionalEffectEvents[e.id] ?? [])
                                    .map(e => `${e.eventSourceId}:${e.eventId}`);
                                return effectTriggerData.includes(triggerMeta.triggerId)
                                    || additionalEffectEvents.includes(triggerMeta.triggerId);
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

frontendCommunicator.on("getEffectDefinition", (effectId) => {
    logger.debug("got effect request", effectId);
    return manager.mapEffectForFrontEnd(
        manager.getEffectById(effectId)
    );
});

module.exports = manager;
