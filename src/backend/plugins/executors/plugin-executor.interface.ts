import {
    InstalledPluginConfig,
    LegacyCustomScript,
    PluginBase,
    Awaitable,
    PluginDetails,
    AdditionalVariableEvent,
    AdditionalEffectEvent
} from "../../../types";
import type { PluginApiContext } from "../plugin-api";

abstract class IBasePluginExecutor {
    abstract canHandle(plugin: PluginBase | LegacyCustomScript): Awaitable<boolean>;

    abstract getPluginDetails(
        plugin: PluginBase | LegacyCustomScript
    ): Awaitable<PluginDetails | null>;
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

export abstract class IPluginExecutor extends IBasePluginExecutor {
    abstract executePlugin(
        plugin: PluginBase | LegacyCustomScript,
        config: InstalledPluginConfig,
        isInstalling?: boolean,
        ctx?: PluginApiContext
    ): Awaitable<PluginExecutionResult>;

    abstract unloadPlugin(
        plugin: PluginBase | LegacyCustomScript,
        config: InstalledPluginConfig,
        registrations?: PluginRegistrations,
        isUninstalling?: boolean
    ): Awaitable<void>;

    updateParameters?(
        plugin: PluginBase | LegacyCustomScript,
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