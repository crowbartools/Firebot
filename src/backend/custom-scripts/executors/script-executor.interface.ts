import { InstalledPluginConfig, LegacyCustomScript, ScriptBase, ScriptContext } from "../../../types/plugins";
import { Awaitable } from "../../../types/util-types";

abstract class IBaseScriptExecutor {
    abstract canHandle(script: ScriptBase | LegacyCustomScript): Awaitable<boolean>;
}

export type ScriptExecutionResult =
    | {
        success: true;
    }
    | {
        success: false;
        error: string;
    };

export abstract class IPluginExecutor extends IBaseScriptExecutor {
    abstract executePlugin(
        script: ScriptBase | LegacyCustomScript,
        config: InstalledPluginConfig,
        isInstalling?: boolean
    ): Awaitable<ScriptExecutionResult>;
}

export type EffectScriptExecutionResult = ScriptExecutionResult & {
    effectExecution?: {
        stop: boolean;
        bubbleStop: boolean;
    };
};

export abstract class IEffectScriptExecutor extends IBaseScriptExecutor {
    abstract executeScript(
        script: ScriptBase | LegacyCustomScript,
        context: ScriptContext
    ): Awaitable<EffectScriptExecutionResult>;
}
