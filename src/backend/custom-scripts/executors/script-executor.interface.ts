import { InstalledPluginConfig, LegacyCustomScript, ScriptBase, ScriptContext, Awaitable, ScriptDetails } from "../../../types";


abstract class IBaseScriptExecutor {
    abstract canHandle(script: ScriptBase | LegacyCustomScript): Awaitable<boolean>;

    abstract getScriptDetails(
        script: ScriptBase | LegacyCustomScript
    ): Awaitable<ScriptDetails | null>;
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

    abstract unloadPlugin(
        script: ScriptBase | LegacyCustomScript,
        config: InstalledPluginConfig,
        isUninstalling?: boolean
    ): Awaitable<void>;
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
