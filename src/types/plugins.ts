/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EffectType, PluginAdditionalEffectEvents } from "./effects";
import type { Trigger } from "./triggers";
import type { Awaitable } from "./util-types";
import type { PluginAdditionalVariableEvents, ReplaceVariable } from "./variables";
import type { EventFilter, EventSource } from "./events";
import type { SystemCommand } from "./commands";
import type { RestrictionType } from "./restrictions";
import type { FirebotParams, FirebotParameterArray } from "./parameters";
import type { FirebotGame } from "./games";
import type { Integration } from "./integrations";
import type { UIExtension } from "./ui-extensions";
import type { OverlayWidgetType } from "./overlay-widgets";
import type { PluginHttpRouteDefinition } from "./http-server";
import type { CustomWebSocketHandler } from "./websocket";
import type { PluginWebhooks } from "./webhooks";

type NoResult = Awaitable<void>;

type GenericParameters = Record<string, unknown>;

export type InstalledPluginConfig<Params extends GenericParameters = GenericParameters> = {
    id: string;
    fileName: string;
    enabled?: boolean;
    legacyImport?: boolean;
    parameters: Params;
};

export type PluginContext<Params extends FirebotParams = FirebotParams> = {
    trigger?: Trigger;
    parameters: Params;
};

type DynamicObject<T> = T | ((context: PluginContext) => Awaitable<T>);
type DynamicArray<T> = Array<T | ((context: PluginContext) => Awaitable<T>)>;

export type PluginType = "script" | "plugin";

interface ManifestDescription {
    short: string;
    long?: string;
}

interface ManifestFirebotVersion {
    major: number;
    minor?: number;
    patch?: number;
}

type FontAwesomeIcon = {
    type: "font-awesome";
    /**
     * A FontAwesome icon name shown in the UI (eg. "fa-cogs").
     */
    name: `fa-${string}`;
    /**
     * A css color value (eg. "#FF0000") used for the icon.
     */
    color?: string;
};

type CustomIcon = {
    type: "custom";
    url: string;
    /**
     * A css color value (eg. "#FF0000") used for the background of the icon.
     */
    backgroundColor?: string;
};

export type PluginIcon = FontAwesomeIcon | CustomIcon;

export interface Manifest {
    name: string;
    version: string;
    author: string;
    description: string | ManifestDescription;

    /**
     * An array of strings that describe or categorize your plugin
     */
    tags?: string[];

    /**
     * A link to the plugin's source code repository
     */
    repo?: string;

    /**
     * A link to the plugin's website
     * If the repo is on GitHub and the website is not specified, it will default to the GitHub repo URL.
     */
    website?: string;
    /**
     * A link to the plugin's issue tracker or support server (e.g. Discord).
     * If the repo is on GitHub and support is not specified, it will default to the GitHub issues URL.
     */
    support?: string;

    minimumFirebotVersion?: ManifestFirebotVersion;
    maximumFirebotVersion?: ManifestFirebotVersion;

    /**
     * The icon to be displayed for the plugin.
     */
    icon?: PluginIcon;

    /**
     * If true, the plugin will be initialized before parameters are shown to the user,
     * allowing the plugin to provide custom parameter types that can be used in its own parametersSchema.
     */
    initBeforeShowingParams?: boolean;
}


export interface PluginBase<Params extends FirebotParams = FirebotParams> {
    manifest: Manifest;

    parametersSchema?: FirebotParameterArray<Params>;
}

export interface Plugin<Params extends FirebotParams = FirebotParams> extends PluginBase<Params> {
    /**
     * Automatically handles registration with appropriate managers for definitions
     * when the plugin is unloaded, definitions will automagically be unregistered.
     *
     * Array entries can be direct definitions or functions that return definitions
     * (or promises of definitions) for dynamic registration based on context (e.g. parameter values).
     */
    registers?: {
        effects?: DynamicArray<EffectType<any, any>>;
        eventSources?: DynamicArray<EventSource>;
        variables?: DynamicArray<ReplaceVariable>;
        integrations?: DynamicArray<Integration<any>>;
        filters?: DynamicArray<EventFilter>;
        restrictions?: DynamicArray<RestrictionType<any>>;
        systemCommands?: DynamicArray<SystemCommand<any>>;
        games?: DynamicArray<FirebotGame>;
        uiExtensions?: DynamicArray<UIExtension>;
        overlayWidgets?: DynamicArray<OverlayWidgetType<any, any>>;
        httpRoutes?: DynamicObject<PluginHttpRouteDefinition>;
        websocketListener?: DynamicObject<CustomWebSocketHandler>;
        webhooks?: DynamicObject<PluginWebhooks>;
        additionalEffectEvents?: DynamicArray<PluginAdditionalEffectEvents>;
        additionalVariableEvents?: DynamicArray<PluginAdditionalVariableEvents>;
    };

    /** Called when the plugin is loaded */
    onLoad?: (context: PluginContext<Params>, isInstalling?: boolean) => NoResult;

    /** Called when Firebot is closing or plugin is disabled / removed  */
    onUnload?: (context: PluginContext<Params>, isUninstalling?: boolean) => NoResult;

    /** Called when the user updates plugin-specific parameters */
    onParameterUpdate?: (context: PluginContext<Params>) => NoResult;
}

export type PluginDetails = Pick<PluginBase, "manifest" | "parametersSchema">;

export type InstalledPlugin = {
    config: InstalledPluginConfig;
    details: PluginDetails;
};

/* Legacy types */
type LegacyScriptParameters = Record<
    string,
    {

        type: any;
        title?: string;
        description?: string;
        secondaryDescription?: string;
        tip?: string;
        showBottomHr?: boolean;
        validation?: {
            required?: boolean;
        };
        value?: unknown;
        default?: unknown;
    }
>;

export type LegacyScriptReturnObject = {
    success: boolean;
    errorMessage?: string;
    effects: unknown[] | { id: string, list: unknown[] };
    callback?: VoidFunction;
};

type LegacyRunRequest = {
    parameters: Record<string, unknown>;
    modules: Record<string, unknown>;
    firebot: {
        accounts: {
            streamer: unknown;
            bot: unknown;
        };
        settings: {
            webServerPort: number;
        };
        version: string;
    };
    trigger: Trigger;
};

type LegacyCustomScriptManifest = {
    name: string;
    description: string;
    version: string;
    author: string;
    website?: string;
    startupOnly?: boolean;
    initBeforeShowingParams?: boolean;
    firebotVersion?: "5";
};

export type LegacyScriptData = {
    id: string;
    name: string;
    scriptName: string;
    parameters: LegacyScriptParameters;
};

export type LegacyCustomScript = {
    getScriptManifest(): Awaitable<LegacyCustomScriptManifest>;
    getDefaultParameters?: () => LegacyScriptParameters;
    run(
        runRequest: LegacyRunRequest
    ): Awaitable<void | LegacyScriptReturnObject>;
    parametersUpdated?: (parameters: Record<string, unknown>) => Awaitable<void>;
    stop?: () => Awaitable<void>;
};

export type FirebotPluginApi = import("./plugin-api").FirebotPluginApi;
export type { PluginLoggerApi as PluginLoggerApi, PluginWebhooksApi as PluginWebhooksApi } from "./plugin-api";
