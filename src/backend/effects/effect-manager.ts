import { TypedEmitter } from "tiny-typed-emitter";

import type { EffectDefinition, EffectType } from "../../types/effects";
import type { TriggerMeta, TriggersObject, TriggerType } from "../../types/triggers";

import * as cloudSync from "../cloud-sync";
import { checkEffectDependencies } from "./effect-helpers";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";

interface FullEventId {
    eventSourceId: string;
    eventId: string;
}

class EffectManager extends TypedEmitter<{
    "effectRegistered": (effect: EffectType<any>) => void;
    "effectUnregistered": (event: { effectId: string, hasOverlayEffect: boolean }) => void;
}> {
    private _registeredEffects: EffectType<any>[] = [];
    private _additionalEffectEvents: Record<string, FullEventId[]> = {};

    constructor() {
        super();

        frontendCommunicator.onAsync("getEffectsShareCode", async (effectList) => {
            logger.debug("got get effects share code request");

            effectList = this.clearFilePaths(effectList);

            //return share code
            return await cloudSync.sync({ effects: effectList });
        });

        frontendCommunicator.onAsync("getAllEffectDefinitions", async () => {
            logger.debug("got get all effects request");
            const mapped = this._registeredEffects.map(this.mapEffectForFrontEnd);
            return mapped;
        });

        frontendCommunicator.onAsync("getEffectDefinitions", async (triggerData: {
            triggerType: TriggerType;
            triggerMeta: TriggerMeta;
        }) => {
            logger.debug("got get effects def request");
            const effects = this._registeredEffects;

            const triggerType = triggerData.triggerType,
                triggerMeta = triggerData.triggerMeta;

            const filteredEffectDefs = effects
                .map(this.mapEffectForFrontEnd)
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
                            const effectTriggerData = e.triggers[triggerType] as unknown;

                            switch (triggerType) {
                                case "event":
                                    if (effectTriggerData === true) {
                                        return true;
                                    }
                                    if (Array.isArray(effectTriggerData)) {
                                        const _additionalEffectEvents = (this._additionalEffectEvents[e.id] ?? [])
                                            .map(e => `${e.eventSourceId}:${e.eventId}`);
                                        return effectTriggerData.includes(triggerMeta.triggerId)
                                    || _additionalEffectEvents.includes(triggerMeta.triggerId);
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
            return this.mapEffectForFrontEnd(
                this.getEffectById(effectId)
            );
        });
    }

    registerEffect<T = unknown>(effect: EffectType<T>): void {
        if (this._registeredEffects.some(e => e?.definition?.id === effect.definition.id)) {
            logger.warn(`Attempted to register duplicate effect: ${effect.definition.id}.`);
            return;
        }

        this._registeredEffects.push(effect);

        logger.debug(`Registered Effect ${effect.definition.id}`);

        this.emit("effectRegistered", effect);
    }

    unregisterEffect(effectId: string): void {
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

    getEffectsForEvent(eventSourceId: string, eventId: string): EffectDefinition[] {
        const effects = this.getEffectDefinitions()
            .filter((e) => {
                if (!e.triggers) {
                    return true;
                }
                const trigger = e.triggers["event"] as TriggersObject["event"];
                return trigger === true
                    || (Array.isArray(trigger)
                        && trigger.some(e => e === `${eventSourceId}:${eventId}`));
            });
        return effects;
    }

    addEventToEffect(effectId: string, eventSourceId: string, eventId: string): void {
        if (this.getEffectsForEvent(eventSourceId, eventId).some(e => e.id === effectId)
            || this._additionalEffectEvents[effectId]?.some(e => e.eventSourceId === eventSourceId && e.eventId === eventId)) {
            logger.warn(`Effect ${effectId} already setup for event ${eventSourceId}:${eventId}`);
            return;
        }

        const additionalEvents = this._additionalEffectEvents[effectId] ?? [];

        additionalEvents.push({ eventSourceId, eventId });

        this._additionalEffectEvents[effectId] = additionalEvents;

        logger.debug(`Added event ${eventSourceId}:${eventId} to effect ${effectId}`);
    }

    removeEventFromEffect(effectId: string, eventSourceId: string, eventId: string): void {
        let additionalEvents = this._additionalEffectEvents[effectId] ?? [];

        if (!additionalEvents.some(e => e.eventSourceId === eventSourceId && e.eventId === eventId)) {
            logger.warn(`Effect ${effectId} does not have a plugin registration for event ${eventSourceId}:${eventId}`);
            return;
        }

        additionalEvents = additionalEvents.filter(e => e.eventSourceId !== eventSourceId && e.eventId !== eventId);
        this._additionalEffectEvents[effectId] = additionalEvents;

        logger.debug(`Removed event ${eventSourceId}:${eventId} from effect ${effectId}`);
    }

    mapEffectForFrontEnd(e: EffectType) {
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

    clearFilePaths(effects: unknown) {
        if (effects == null) {
            return effects;
        }

        const keys = Object.keys(effects);

        for (const key of keys) {
            const value = effects[key] as unknown;

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

export { manager as EffectManager };