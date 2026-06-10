import { randomUUID } from "crypto";
import type {
    ScriptBase,
    LegacyCustomScript,
    ScriptContext,
    ScriptDetails,
    LegacyScriptReturnObject,
    FirebotParameterArray,
    EffectList,
    Trigger,
    RunEffectsContext
} from "../../../types";
import type { EffectScriptExecutionResult } from "./script-executor.interface";
import {
    buildRunRequest,
    mapParameters
} from "../../common/handlers/custom-scripts/custom-script-helpers";
import * as effectRunner from "../../common/effect-runner";
import { LoggerCache } from "../../logger-cache";
import { simpleClone, wait } from "../../utils";

const logger = LoggerCache.getLogger("Plugins");

/**
 * Executor for legacy effect scripts (run function with no manifest or startupOnly !== true)
 */
export class LegacyEffectScriptExecutor {
    async canHandle(script: ScriptBase | LegacyCustomScript): Promise<boolean> {
        if (!this.isLegacy(script)) {
            return false;
        }
        if (typeof script?.getScriptManifest === "function") {
            try {
                const manifest = await script.getScriptManifest();
                return !manifest?.startupOnly;
            } catch (error) {
                logger.error("Error while getting legacy script manifest", error);
                return false;
            }
        }
        return true;
    }

    async getScriptDetails(script: ScriptBase | LegacyCustomScript): Promise<ScriptDetails | null> {
        if (!this.isLegacy(script)) {
            return null;
        }

        const manifest = await script.getScriptManifest?.();
        const parametersObject = script.getDefaultParameters?.() ?? {};
        const parametersArray = Object.entries(parametersObject).map(([key, value]) => ({
            ...value,
            name: key
        })) as unknown as FirebotParameterArray<Record<string, unknown>>;

        return {
            manifest: {
                version: manifest?.version ?? "0.0.0",
                author: manifest?.author ?? "Unknown",
                name: manifest?.name ?? "Unknown",
                description: manifest?.description ?? "No description",
                website: manifest?.website ?? "No website",
                type: "script"
            },
            parametersSchema: parametersArray
        };
    }

    async executeScript(
        script: ScriptBase | LegacyCustomScript,
        context: ScriptContext
    ): Promise<EffectScriptExecutionResult> {
        if (!this.isLegacy(script)) {
            return { success: false, error: "Invalid script type" };
        }

        const manifest = await script.getScriptManifest();

        // The legacy "Run Custom Script" effect stores params as { [name]: { value, type, ... } }.
        // Newly saved effects will store them flat (from the new schema-aware UI), so support both.
        const rawParams = (context.parameters ?? {});
        const looksLegacyShape = Object.values(rawParams).some(
            v => v != null && typeof v === "object" && Object.prototype.hasOwnProperty.call(v, "value")
        );
        const parameters = looksLegacyShape
            ? mapParameters(rawParams as never)
            : rawParams;

        const runRequest = buildRunRequest(manifest, parameters, context.trigger ?? {});

        let response: LegacyScriptReturnObject | undefined;
        try {
            response = (await Promise.race([
                Promise.resolve(script.run(runRequest as never)),
                wait(10 * 1000)
            ])) as LegacyScriptReturnObject | undefined;
        } catch (error) {
            logger.error("Error while running legacy effect script", error);
            return { success: false, error: (error as Error)?.message ?? "Error while running script" };
        }

        if (response == null || typeof response !== "object") {
            return { success: true };
        }

        if (!response.success) {
            return { success: false, error: response.errorMessage ?? "Script reported failure" };
        }

        const callback = typeof response.callback === "function" ? response.callback : () => undefined;

        if (response.effects != null) {
            const execution = await this.runEffectsResult(
                response.effects as never,
                context,
                () => callback()
            );
            return { success: true, execution };
        }

        return { success: true };
    }

    private isLegacy(script: ScriptBase | LegacyCustomScript): script is LegacyCustomScript {
        const hasNewManifest = (script as ScriptBase).manifest != null;

        if (hasNewManifest) {
            return false;
        }

        const hasRunFunction = typeof (script as LegacyCustomScript)?.run === "function";

        if (!hasRunFunction) {
            return false;
        }

        return true;
    }

    /**
     * Runs effects returned by a custom script and returns flow-control flags.
     */
    private async runEffectsResult(
        effects: EffectList | Array<{ id?: string, type?: string }>,
        context: ScriptContext,
        onEffectsDone?: () => unknown
    ): Promise<{ stop: boolean, bubbleStop: boolean } | undefined> {
        const effectsIsArray = Array.isArray(effects);

        let effectsObj: EffectList;
        if (!effectsIsArray && (effects).list != null) {
            effectsObj = effects;
        } else if (effectsIsArray) {
            effectsObj = {
                id: randomUUID(),
                list: (effects as Array<{ id?: string, type?: string }>)
                    .filter(e => e.type != null && e.type !== "")
                    .map((e) => {
                        if (e.id == null) {
                            e.id = randomUUID();
                        }
                        return e;
                    })
            } as EffectList;
        } else {
            return undefined;
        }

        const clonedTrigger = simpleClone(context.trigger ?? ({} as Trigger));
        const processEffectsRequest: RunEffectsContext = {
            trigger: clonedTrigger,
            effects: effectsObj
        };

        try {
            const runResult = await effectRunner.processEffects(processEffectsRequest);

            if (typeof onEffectsDone === "function") {
                try {
                    await Promise.resolve(onEffectsDone());
                } catch (error) {
                    logger.warn("Error in script onEffectsDone callback", error);
                }
            }

            if (runResult != null && runResult.success === true && runResult.stopEffectExecution) {
                return { stop: true, bubbleStop: true };
            }
        } catch (error) {
            logger.error("Error running effects for script", error);
        }

        return undefined;
    }
}