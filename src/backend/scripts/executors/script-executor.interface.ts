import {
    InstalledPluginConfig,
    LegacyCustomScript,
    ScriptBase,
    Awaitable,
    ScriptDetails,
    AdditionalVariableEvent,
    AdditionalEffectEvent
} from "../../../types";
import type { ScriptApiContext } from "../script-api";

abstract class IBaseScriptExecutor {
    abstract canHandle(script: ScriptBase | LegacyCustomScript): Awaitable<boolean>;

    abstract getScriptDetails(
        script: ScriptBase | LegacyCustomScript
    ): Awaitable<ScriptDetails | null>;
}

export interface PluginRegistrations {
    effectIds?: string[];
    variableHandles?: string[];
    eventSourceIds?: string[];
    filterIds?: string[];
    systemCommandIds?: string[];
    restrictionIds?: string[];
    integrationIds?: string[];
    gameIds?: string[];
    uiExtensionIds?: string[];
    overlayWidgetIds?: string[];
    httpRoutePrefix?: string;
    websocketListenerName?: string;
    additionalVariableEvents?: AdditionalVariableEvent[];
    additionalEffectEvents?: AdditionalEffectEvent[];
}

export type PluginExecutionResult =
    | {
        success: true;
        registrations?: PluginRegistrations;
    }
    | {
        success: false;
        error: string;
    };

export abstract class IPluginExecutor extends IBaseScriptExecutor {
    abstract executePlugin(
        script: ScriptBase | LegacyCustomScript,
        config: InstalledPluginConfig,
        isInstalling?: boolean,
        ctx?: ScriptApiContext
    ): Awaitable<PluginExecutionResult>;

    abstract unloadPlugin(
        script: ScriptBase | LegacyCustomScript,
        config: InstalledPluginConfig,
        registrations?: PluginRegistrations,
        isUninstalling?: boolean
    ): Awaitable<void>;

    updateParameters?(
        script: ScriptBase | LegacyCustomScript,
        config: InstalledPluginConfig
    ): Awaitable<void>;
}

export type EffectScriptExecutionResult =
    | {
        success: true;
        execution?: {
            stop: boolean;
            bubbleStop: boolean;
        };
    }
    | {
        success: false;
        error: string;
    };