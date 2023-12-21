type ScriptParameters = Record<
string,
{
    type: string;
    description: string;
    secondaryDescription: string;
    value: unknown;
    default: unknown;
}
>;

type ScriptReturnObject = {
    success: boolean;
    errorMessage?: string;
    effects: unknown[] | { id: string; list: unknown[] };
    callback?: VoidFunction;
};

type Trigger = {
    type: string;
    metadata: Record<string, unknown>;
};

type RunRequest = {
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

type CustomScriptManifest = {
    name: string;
    description: string;
    version: string;
    author: string;
    website?: string;
    startupOnly?: boolean;
    firebotVersion?: "5";
};

export type ScriptData = {
    id: string;
    name: string;
    scriptName: string;
    parameters: ScriptParameters;
};

export type CustomScript = {
    getScriptManifest(): CustomScriptManifest | PromiseLike<CustomScriptManifest>;
    getDefaultParameters(): ScriptParameters;
    run(
        runRequest: RunRequest
    ): void | PromiseLike<void> | ScriptReturnObject | PromiseLike<ScriptReturnObject>;
    parametersUpdated?: (parameters: Record<string, unknown>) => void | PromiseLike<void>;
    stop?: () => void | PromiseLike<void>;
};
