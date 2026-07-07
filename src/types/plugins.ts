/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EffectType, PluginAdditionalEffectEvents } from "./effects";
import type { Trigger } from "./triggers";
import type { Awaitable } from "./util-types";
import type { PluginAdditionalVariableEvents, ReplaceVariable } from "./variables";
import type { EventFilter, EventSource, PluginAdditionalFilterEvents } from "./events";
import type { SystemCommand } from "./commands";
import type { RestrictionType } from "./restrictions";
import type { FirebotParams, FirebotParameterArray } from "./parameters";
import type { FirebotGame } from "./games";
import type { Integration } from "./integrations";
import type { FrontendListener, UIExtension } from "./ui-extensions";
import type { OverlayWidgetType } from "./overlay-widgets";
import type { PluginHttpRouteDefinition } from "./http-server";
import type { PluginWebSocketHandler } from "./websocket";
import type { PluginWebhooks } from "./webhooks";
import { ConditionType } from "./conditions";

type NoResult = Awaitable<void>;

type GenericParameters = Record<string, unknown>;

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

export type ManagedPluginManifest = {
    name: string;
    author: string;
    description: string;
    /** Must be a semver string */
    version: string;
    downloadUrl: string;
    sha256: string;
    /** Must be an ISO-8601 string */
    releaseDate: string;
    type: "single-file" | "zip";

    icon?: PluginIcon;
    tags?: string[];
    repo?: string;
    website?: string;
    support?: string;
    minimumFirebotVersion?: ManifestFirebotVersion;
    maximumFirebotVersion?: ManifestFirebotVersion;
};

export type ManagedPluginBase = {
    author: string;
    name: string;
    version: string;
};

export type ManagedPlugin = ManagedPluginBase & {
    manifest: ManagedPluginManifest;
};

export type ManagedPluginExtended = ManagedPlugin & {
    installed: boolean;
    installedVersion?: string;
};

export type ManagedPluginUpdateRequest = {
    plugins: Array<ManagedPluginBase>;
    firebotVersion: ManifestFirebotVersion;
};

export type InstalledPluginConfig<Params extends GenericParameters = GenericParameters> = {
    id: string;
    fileName: string;
    enabled?: boolean;
    legacyImport?: boolean;
    managedPluginDetails?: ManagedPluginBase;
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

export interface ManifestFirebotVersion {
    major: number;
    minor?: number;
    patch?: number;
}

export interface Manifest {
    /**
     * Name of the plugin
     */
    name: string;

    /**
     * Version of the plugin
     */
    version: string;

    /**
     * Author of the plugin
     */
    author: string;

    /**
     * Description of the plugin
     */
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
     * A link to the plugin's website. If the repo is on GitHub and the website
     * is not specified, it will default to the GitHub repo URL.
     */
    website?: string;

    /**
     * A link to the plugin's issue tracker or support server (e.g. Discord).
     * If the repo is on GitHub and support is not specified, it will default to the GitHub issues URL.
     */
    support?: string;

    /**
     * The lowest Firebot version this plugin is compatible with
     */
    minimumFirebotVersion?: ManifestFirebotVersion;

    /**
     * The highest Firebot version this plugin is compatible with
     */
    maximumFirebotVersion?: ManifestFirebotVersion;

    /**
     * The icon to be displayed for the plugin.
     */
    icon?: PluginIcon;
}


export interface PluginBase<Params extends FirebotParams = FirebotParams> {
    /**
     * Basic information about the plugin
     */
    manifest: Manifest;

    /**
     * Defines the user-specified parameters for this plugin
     */
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
        conditions?: DynamicArray<ConditionType<any, any, any>>;
        systemCommands?: DynamicArray<SystemCommand<any>>;
        games?: DynamicArray<FirebotGame>;
        frontendListeners?: DynamicArray<FrontendListener>;
        uiExtensions?: DynamicArray<UIExtension>;
        overlayWidgets?: DynamicArray<OverlayWidgetType<any, any>>;
        httpRoutes?: DynamicObject<PluginHttpRouteDefinition>;
        websocketListener?: DynamicObject<PluginWebSocketHandler>;
        webhooks?: DynamicObject<PluginWebhooks>;
        additionalEffectEvents?: DynamicArray<PluginAdditionalEffectEvents>;
        additionalVariableEvents?: DynamicArray<PluginAdditionalVariableEvents>;
        additionalFilterEvents?: DynamicArray<PluginAdditionalFilterEvents>;
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
