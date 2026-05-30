import { EffectInstance, EffectList, EffectType } from "./effects";
import { Trigger } from "./triggers";
import { Awaitable } from "./util-types";
import { ReplaceVariable } from "./variables";
import { EventFilter, EventSource } from "./events";
import { SystemCommand } from "./commands";
import { RestrictionType } from "./restrictions";
import { FirebotParams, FirebotParameterArray } from "./parameters";
import { FirebotGame } from "./games";
import { Integration } from "./integrations";
import { UIExtension } from "./ui-extensions";

type NoResult = Awaitable<void>;

type GenericParameters = Record<string, unknown>;

export type InstalledPluginConfig<Params extends GenericParameters = GenericParameters> = {
    id: string;
    fileName: string;
    enabled?: boolean;
    legacyImport?: boolean;
    parameters: Params;
};

export type ScriptContext<Params extends FirebotParams = FirebotParams> = {
    trigger?: Trigger;
    parameters: Params;
};

type DynamicArray<T> = Array<T | ((context: ScriptContext) => Awaitable<T>)>;

export type ScriptType = "script" | "plugin";

interface ManifestDescription {
    short: string;
    long?: string;
}

interface ManifestFirebotVersion {
    major: number;
    minor?: number;
    patch?: number;
}

export interface Manifest {
    name: string;
    version: string;
    author: string;
    description: string | ManifestDescription;

    keywords?: string[];

    repo?: string;

    // Note: autofilled if repo is assumed github and not specified
    website?: string;
    report?: string;
    source?: string;

    minimumFirebotVersion?: ManifestFirebotVersion;
    maximumFirebotVersion?: ManifestFirebotVersion;

    icon?: `fa-${string}`;
    color?: string;

    type: ScriptType;
}

type EffectScriptResult = {
    success: boolean;
    errorMessage?: string;
    effects?: EffectList | Array<EffectInstance>;
    onEffectsDone?: () => Awaitable<void>;
};


export interface ScriptBase<Params extends FirebotParams = FirebotParams> {
    manifest: Manifest;

    parametersSchema?: FirebotParameterArray<Params>;

    // if uninstalled is true, the script is being removed by the user, thus the script should remove related data files/assets
    // otherwise the script should assume firebot is closing or the script is being reloaded
    onUnload?: (context: ScriptContext<Params>, isUninstalling?: boolean) => NoResult;
}

// Supplants the "Run Script" effect script functionality
export interface EffectScript<Params extends FirebotParams = FirebotParams> extends ScriptBase<Params> {
    run: (context: ScriptContext<Params>) => Awaitable<void | EffectScriptResult>;
}

// Supplants the "Start up" script functionality
export interface Plugin<Params extends FirebotParams = FirebotParams> extends ScriptBase<Params> {
    // Note: At least one is required: onLoad or registers.*
    // if not met, the script will not be loaded and it should be logged the script does nothing

    // Automatically handles registration with appropriate managers for definitions
    // when the script is unloaded, definitions will automagically be unregistered
    registers?: {

        // If value within array is a function, call said function to get definition
        // If definition is or evaluates to promise, await promise
        effects?: DynamicArray<EffectType>;
        eventSources?: DynamicArray<EventSource>;
        variables?: DynamicArray<ReplaceVariable>;
        integrations?: DynamicArray<Integration>;
        filters?: DynamicArray<EventFilter>;
        restrictions?: DynamicArray<RestrictionType>;
        systemCommands?: DynamicArray<SystemCommand>;
        games?: DynamicArray<FirebotGame>;
        uiExtensions?: DynamicArray<UIExtension>;
    };

    // Called when the script is loaded
    onLoad?: (context: ScriptContext<Params>, isInstalling?: boolean) => NoResult;

    // Called when firebot is closing or plugin is disabled / removed
    onUnload?: (context: ScriptContext<Params>, isUninstalling?: boolean) => NoResult;

    // called when the user updates plugin-specific parameters
    onParameterUpdate?: (context: ScriptContext<Params>) => NoResult;
}

export type ScriptDetails = Pick<ScriptBase, "manifest" | "parametersSchema">;

export type InstalledPlugin = {
    config: InstalledPluginConfig;
    details: ScriptDetails;
};

/* Legacy types */

type LegacyScriptParameters = Record<
    string,
    {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export type FirebotScriptApi = import("./script-api").FirebotScriptApi;
export type { ScriptLoggerApi, ScriptWebhooksApi, ScriptWebhook, ScriptWebhookEvent } from "./script-api";
