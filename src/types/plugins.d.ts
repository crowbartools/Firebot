import { Integration } from "@crowbartools/firebot-custom-scripts-types";
import { Effect, EffectList, EffectType } from "./effects";
import { Trigger } from "./triggers";
import { Awaitable, NoFunctionValue } from "./util-types";
import { ReplaceVariable } from "./variables";
import { EventFilter } from "./events";
import { RestrictionType } from "@crowbartools/firebot-custom-scripts-types/types/restrictions";
import { SystemCommand } from "./commands";
import { FirebotParameterCategories, FirebotParams } from "./parameters";
import { FirebotGame } from "src/backend/games/game-manager";
import winston from "winston";
import { FrontendCommunicatorModule } from "./script-modules";
import EffectManager from "../backend/effects/effectManager";
import ReplaceVariableManager from "../backend/variables/replace-variable-manager";

type GenericParameters = Record<string, Record<string, unknown>>;

export type InstalledPluginConfig<Params extends GenericParameters = GenericParameters> = {
    id: string;
    fileName: string;
    enabled?: boolean;
    legacyImport?: boolean;
    parameters: Params;
};

type ScriptContext = {
    trigger?: Trigger;
    parameters: Record<string, unknown>;
};

type DynamicArray<T> = Array<T | ((context: ScriptContext) => Awaitable<T>)>;

type ScriptType = "script" | "plugin";

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

    type: ScriptType;
}

type EffectScriptResult = {
    success: boolean;
    errorMessage?: string;
    effects?: EffectList | Array<Effect>;
    onEffectsDone?: () => Awaitable<void>;
};


interface ScriptBase<Params extends FirebotParams = Record<string, Record<string, unknown>>> {
    manifest: Manifest;

    parameters?: FirebotParameterCategories<Params>;

    // if uninstalled is true, the script is being removed by the user, thus the script should remove related data files/assets
    // otherwise the script should assume firebot is closing or the script is being reloaded
    onUnload?: (pluginManager: PluginManager, /* args, */ uninstalled: boolean) => NoResult;
}

// Supplants the "Run Script" effect script functionality
interface EffectScript<Params extends FirebotParams = Record<string, Record<string, unknown>>> extends ScriptBase<Params> {
    run: (context: ScriptContext) => Awaitable<void | EffectScriptResult>;
}

// Supplants the "Start up" script functionality
interface Plugin<Params extends FirebotParams = Record<string, Record<string, unknown>>> extends ScriptBase<Params> {
    // Note: Atleast one is required: onLoad or registers.*
    // if not met, the script will not be loaded and it should be logged the script does nothing

    // Automatically handles registration with appropriate managers for definitions
    // when the script is unloaded, definitions will automagically be unregistered
    registers?: {

        // If value within array is a function, call said function to get definition
        // If definition is or evaluates to promise, await promise
        effects?: DynamicArray<EffectType>;
        eventSources?: DynamicArray<EventSource>;
        variables?: DynamicArray<ReplaceVariable>;
        // endpoints?: DynamicArray<HttpEndpoint>;
        integrations?: DynamicArray<Integration>;
        filters?: DynamicArray<EventFilter>;
        restrictions?: DynamicArray<RestrictionType>;
        systemCommands?: DynamicArray<SystemCommand>;
        games?: DynamicArray<FirebotGame>;
    };

    // Called when the script is loaded
    onLoad?: (context: ScriptContext, isInstalling?: boolean) => NoResult;

    // Called when firebot is closing or plugin is disabled / removed
    onUnload?: (context: ScriptContext, isUninstalling?: boolean) => NoResult;

    // called when the user updates plugin-specific parameters
    onParameterUpdate?: (context: ScriptContext) => NoResult;
}

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

type LegacyScriptReturnObject = {
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

export type FirebotScriptApi = {
    version: string;
    logger: winston.LoggerInstance;
    frontend: FrontendCommunicatorModule;
    effects: EffectManager;
    replaceVariables: ReplaceVariableManager;
};
