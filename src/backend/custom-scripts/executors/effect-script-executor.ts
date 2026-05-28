import { ScriptBase, LegacyCustomScript, ScriptContext, ScriptDetails, EffectList, RunEffectsContext, Trigger, EffectScript } from "../../../types";
import {
    IEffectScriptExecutor,
    EffectScriptExecutionResult
} from "./script-executor.interface";
import logger from "../../logwrapper";
import { wait, simpleClone } from "../../utils";
import { randomUUID } from "crypto";
import * as effectRunner from "../../common/effect-runner";


/**
 * Executor for new-spec EffectScripts (manifest.type === "script")
 */
export class EffectScriptExecutor extends IEffectScriptExecutor {
    constructor() {
        super();
    }

    canHandle(script: ScriptBase | LegacyCustomScript): boolean {
        return this.isEffectScript(script);
    }

    getScriptDetails(script: ScriptBase | LegacyCustomScript): ScriptDetails | null {
        if (!this.isEffectScript(script)) {
            return null;
        }
        return {
            manifest: script.manifest,
            parametersSchema: script.parametersSchema
        };
    }

    async executeScript(
        script: ScriptBase | LegacyCustomScript,
        context: ScriptContext
    ): Promise<EffectScriptExecutionResult> {
        if (!this.isEffectScript(script)) {
            return { success: false, error: "Invalid script type" };
        }

        let response: unknown;
        try {
            response = await Promise.race([
                Promise.resolve(script.run(context)),
                wait(10 * 1000)
            ]);
        } catch (error) {
            logger.error("Error while running effect script", error);
            return { success: false, error: (error as Error)?.message ?? "Error while running script" };
        }

        if (response == null || typeof response !== "object") {
            return { success: true };
        }

        const result = response as {
            success?: boolean;
            errorMessage?: string;
            effects?: EffectList | Array<{ id?: string, type?: string }>;
            onEffectsDone?: () => unknown;
        };

        if (result.success === false) {
            return { success: false, error: result.errorMessage ?? "Script reported failure" };
        }

        if (result.effects != null) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            const execution = await runEffectsResult(result.effects, context, result.onEffectsDone);
            return { success: true, execution };
        }

        return { success: true };
    }

    private isEffectScript(script: ScriptBase | LegacyCustomScript): script is EffectScript {
        return (script as ScriptBase).manifest != null
            && (script as ScriptBase).manifest.type === "script"
            && typeof (script as EffectScript).run === "function";
    }
}

/**
 * Runs effects returned by a custom script and returns flow-control flags.
 */
export async function runEffectsResult(
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
