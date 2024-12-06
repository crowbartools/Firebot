import { FirebotParameterCategories } from "../../../types/parameters";
import { InstalledPluginConfig, LegacyCustomScript, Manifest, ScriptBase, ScriptContext } from "../../../types/plugins";
import { Awaitable } from "../../../types/util-types";


export type ScriptDetails = {
    manifest: Manifest;
    parameters: FirebotParameterCategories<Record<string, Record<string, unknown>>>;
};

abstract class IBaseScriptExecutor {
    abstract canHandle(script: ScriptBase | LegacyCustomScript): Awaitable<boolean>;

    abstract getScriptDetails(script: ScriptBase | LegacyCustomScript): Awaitable<ScriptDetails | null>;
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
