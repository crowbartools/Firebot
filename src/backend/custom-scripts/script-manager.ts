import {
    InstalledPlugin,
    InstalledPluginConfig,
    LegacyCustomScript,
    Manifest,
    ScriptBase,
    ScriptContext,
    ScriptDetails,
    ScriptType,
    Trigger
} from "../../types";
import path from "path";
import { promises as fsp, existsSync, readFileSync } from "fs";
import Module from "module";

import { ProfileManager } from "../common/profile-manager";
import logger from "../logwrapper";
import frontendCommunicator from "../common/frontend-communicator";
import { SettingsManager } from "../common/settings-manager";
import { PluginConfigManager } from "./plugin-config-manager";

import { PluginExecutor } from "./executors/plugin-executor";
import { LegacyStartUpScript } from "./executors/legacy-startup-script-executor";
import { EffectScriptExecutor } from "./executors/effect-script-executor";
import { LegacyEffectScriptExecutor } from "./executors/legacy-effect-script-executor";
import {
    EffectScriptExecutionResult,
    IEffectScriptExecutor,
    IPluginExecutor,
    PluginRegistrations,
    ScriptExecutionResult
} from "./executors/script-executor.interface";
import { buildScriptApi, createScriptApiContext } from "./script-api";
import type { ScriptApiContext, ScriptApiContextSource } from "./script-api";
import type { DisposeBag } from "./script-api/internal/dispose-bag";
import type { FirebotScriptApi } from "../../types/script-api";

type LoadedScript = ScriptBase | LegacyCustomScript;
type AnyPluginExecutor = IPluginExecutor;

interface IsolatedModule {
    filename: string;
    paths: string[];
    exports: unknown;
    _compile(src: string, filename: string): void;
}

interface ActivePluginEntry {
    script: LoadedScript;
    config: InstalledPluginConfig;
    executor: AnyPluginExecutor;
    registrations: PluginRegistrations;
    fileName: string;
    apiInstance: ScriptApiInstance;
}

interface ScriptApiInstance {
    context: ScriptApiContext;
    disposeBag: DisposeBag;
    api: FirebotScriptApi;
    setManifest(manifest: Manifest | undefined): void;
}

type GetScriptDetailsResult = {
    success: true;
    fileName: string;
    scriptType: "plugin" | "script";
    details: ScriptDetails;
} | {
    success: false;
    error: string;
};

class ScriptManager {
    private activePlugins: Record<string, ActivePluginEntry> = {};
    private activePluginsByFileName: Map<string, ActivePluginEntry> = new Map();

    private pendingApiInstances: Map<string, ScriptApiInstance> = new Map();
    private effectScriptApiInstances: Map<string, ScriptApiInstance> = new Map();

    private requireInterceptorInstalled = false;

    private pluginExecutors: IPluginExecutor[] = [
        new PluginExecutor(),
        new LegacyStartUpScript()
    ];

    private effectScriptExecutors: IEffectScriptExecutor[] = [
        new EffectScriptExecutor(),
        new LegacyEffectScriptExecutor()
    ];

    constructor() {
        this.installRequireInterceptor();
    }

    // #region Plugin lifecycle

    async startPlugin(pluginConfig: InstalledPluginConfig, installing?: boolean): Promise<void> {
        if (pluginConfig.enabled === false) {
            return;
        }

        if (this.activePlugins[pluginConfig.id]) {
            logger.warn(`Plugin ${pluginConfig.fileName} is already loaded.`);
            return;
        }

        const scriptFilePath = this.getScriptFilePath(pluginConfig.fileName);

        const apiInstance = this.createApiInstance({ kind: "plugin", config: pluginConfig });
        this.pendingApiInstances.set(pluginConfig.fileName, apiInstance);

        const script = this.loadScript(scriptFilePath);
        if (!script) {
            await apiInstance.disposeBag.drain();
            this.pendingApiInstances.delete(pluginConfig.fileName);
            return;
        }

        apiInstance.setManifest((script as ScriptBase | undefined)?.manifest);

        if (!(await this.scriptCanBePlugin(script))) {
            logger.warn(`Script ${pluginConfig.fileName} is not a valid plugin.`);
            await apiInstance.disposeBag.drain();
            this.pendingApiInstances.delete(pluginConfig.fileName);
            delete require.cache[require.resolve(scriptFilePath)];
            return;
        }

        const executor = await this.findPluginExecutor(script);
        if (!executor) {
            logger.warn(`No plugin executor found for ${pluginConfig.fileName}.`);
            await apiInstance.disposeBag.drain();
            this.pendingApiInstances.delete(pluginConfig.fileName);
            delete require.cache[require.resolve(scriptFilePath)];
            return;
        }

        let result: ScriptExecutionResult;
        try {
            result = await executor.executePlugin(script, pluginConfig, installing);
        } catch (error) {
            result = { success: false as const, error: (error as Error)?.message ?? "Unknown error" };
        }

        if (result.success === true) {
            this.activePlugins[pluginConfig.id] = {
                script,
                config: pluginConfig,
                executor,
                registrations: result.registrations ?? {},
                fileName: pluginConfig.fileName,
                apiInstance
            };
            this.activePluginsByFileName.set(pluginConfig.fileName, this.activePlugins[pluginConfig.id]);
            this.pendingApiInstances.delete(pluginConfig.fileName);
            logger.info(`Started plugin ${pluginConfig.fileName}`);
        } else {
            logger.warn(`Could not start plugin ${pluginConfig.fileName}: ${result.error}`);
            await apiInstance.disposeBag.drain();
            this.pendingApiInstances.delete(pluginConfig.fileName);
            delete require.cache[require.resolve(scriptFilePath)];
        }
    }

    async startPlugins(): Promise<void> {
        const pluginConfigs = PluginConfigManager.getAllItems();
        for (const pluginConfig of pluginConfigs) {
            if (pluginConfig.enabled !== false) {
                logger.info(`Starting plugin ${pluginConfig.fileName}`);
                await this.startPlugin(pluginConfig, false);
            }
        }
        logger.info("All plugins started");
    }

    async stopPlugin(pluginId: string, uninstalling = false): Promise<void> {
        const active = this.activePlugins[pluginId];
        if (!active) {
            return;
        }

        try {
            await active.executor.unloadPlugin(active.script, active.config, active.registrations, uninstalling);
        } catch (error) {
            logger.error(`Error while unloading plugin ${active.fileName}`, error);
        }

        try {
            const scriptFilePath = this.getScriptFilePath(active.fileName);
            delete require.cache[require.resolve(scriptFilePath)];
        } catch (error) {
            logger.warn(`Could not clear require cache for plugin ${active.fileName}`, error);
        }

        await active.apiInstance.disposeBag.drain();

        delete this.activePlugins[pluginId];
        this.activePluginsByFileName.delete(active.fileName);
        logger.info(`Stopped plugin ${active.fileName}`);
    }

    async stopAllPlugins(): Promise<void> {
        logger.info("Stopping all plugins...");
        for (const id of Object.keys(this.activePlugins)) {
            await this.stopPlugin(id, false);
        }
        for (const fileName of Array.from(this.effectScriptApiInstances.keys())) {
            await this.disposeEffectScriptApi(fileName);
        }
        logger.info("Stopped all plugins");
    }

    /**
     * Handle a config change. Starts/stops as needed, and on a still-enabled plugin
     * either re-loads (if file may have changed) or invokes onParameterUpdate.
     */
    async reloadPluginConfig(pluginConfig: InstalledPluginConfig): Promise<void> {
        const active = this.activePlugins[pluginConfig.id];

        // Disabled now → stop if running
        if (pluginConfig.enabled === false) {
            if (active) {
                await this.stopPlugin(pluginConfig.id, false);
            }
            return;
        }

        // Enabled, not yet running → start
        if (!active) {
            await this.startPlugin(pluginConfig, false);
            return;
        }

        // Enabled, already running → update config + notify
        active.config = pluginConfig;
        try {
            await active.executor.updateParameters?.(active.script, pluginConfig);
        } catch (error) {
            logger.error(`Error during updateParameters for ${active.fileName}`, error);
        }
    }

    async setPluginEnabled(pluginId: string, enabled: boolean): Promise<void> {
        const config = PluginConfigManager.getItem(pluginId);
        if (!config) {
            return;
        }
        config.enabled = enabled;
        PluginConfigManager.saveItem(config);
        await this.reloadPluginConfig(config);
    }

    // #endregion

    // #region Plugin installation

    async getInstalledPlugins(): Promise<InstalledPlugin[]> {
        const pluginConfigs = PluginConfigManager.getAllItems();
        const installedPlugins: InstalledPlugin[] = [];

        for (const pluginConfig of pluginConfigs) {
            const scriptFilePath = this.getScriptFilePath(pluginConfig.fileName);
            // Use the isolated loader so inspecting a plugin (e.g. for the list UI)
            // cannot disturb the cached module a running plugin is holding.
            const script = this.loadScriptIsolated(scriptFilePath);

            if (!script || !(await this.scriptCanBePlugin(script))) {
                if (script) {
                    logger.warn(`Script ${pluginConfig.fileName} is not a valid plugin.`);
                }
                continue;
            }

            const executor = await this.findPluginExecutor(script);
            if (!executor) {
                continue;
            }

            try {
                const details = await executor.getScriptDetails(script);
                if (details) {
                    installedPlugins.push({ config: pluginConfig, details });
                }
            } catch (error) {
                logger.warn(`Error reading details for ${pluginConfig.fileName}`, error);
            }
        }

        return installedPlugins;
    }

    /**
     * Loads a script file (without persisting a config) and returns its details for
     * the install / edit UI.
     */
    async getScriptDetailsByFileName(fileName: string, expectedScriptType?: ScriptType): Promise<GetScriptDetailsResult> {
        const scriptFilePath = this.getScriptFilePath(fileName);
        if (!existsSync(scriptFilePath)) {
            return { success: false, error: "Script file does not exist" };
        }


        const script = this.loadScriptIsolated(scriptFilePath);
        if (!script) {
            return { success: false, error: "Could not load script" };
        }

        // Try plugin executors first (covers new-spec plugins + legacy startup scripts)
        for (const executor of this.pluginExecutors) {
            if (await executor.canHandle(script)) {
                if (expectedScriptType && expectedScriptType !== "plugin") {
                    return { success: false, error: `Only ${expectedScriptType}'s are allowed.` };
                }
                const details = await executor.getScriptDetails(script);
                if (details) {
                    return { success: true, fileName, scriptType: "plugin", details };
                }
            }
        }

        for (const executor of this.effectScriptExecutors) {
            if (await executor.canHandle(script)) {
                if (expectedScriptType && expectedScriptType !== "script") {
                    return { success: false, error: `Only ${expectedScriptType}'s are allowed.` };
                }
                const details = await executor.getScriptDetails(script);
                if (details) {
                    return { success: true, fileName, scriptType: "script", details };
                }
            }
        }

        return { success: false, error: "Script does not match any known custom-script format" };
    }

    /**
     * Validates a file at any path on disk and copies it into the scripts folder.
     * Does NOT persist an InstalledPluginConfig — caller does that on save.
     */
    async installScriptFromPath(
        sourcePath: string,
        overwrite = false
    ): Promise<GetScriptDetailsResult | { success: false, error: string, conflict?: boolean }> {
        if (!sourcePath || typeof sourcePath !== "string") {
            return { success: false, error: "Invalid file path." };
        }

        if (path.extname(sourcePath).toLowerCase() !== ".js") {
            return { success: false, error: "Only .js script files are supported." };
        }

        if (!existsSync(sourcePath)) {
            return { success: false, error: "Selected file does not exist." };
        }

        const fileName = path.basename(sourcePath);
        const destFolder = ProfileManager.getPathInProfile("/scripts");
        const destPath = path.resolve(destFolder, fileName);

        if (existsSync(destPath) && !overwrite) {
            return { success: false, error: `A script named '${fileName}' already exists in the scripts folder.`, conflict: true };
        }

        // copy then load, and if it doesn't validate, remove the copy.
        try {
            await fsp.mkdir(destFolder, { recursive: true });
            await fsp.copyFile(sourcePath, destPath);
        } catch (error) {
            return { success: false, error: `Failed to copy script: ${(error as Error).message}` };
        }

        const details = await this.getScriptDetailsByFileName(fileName);
        if (details.success === false) {
            try {
                await fsp.unlink(destPath);
            } catch {
                // best-effort
            }
            return details;
        }

        return details;
    }

    /**
     * Delete a copied script file that the user cancelled installing, but only
     * when no config currently references it.
     */
    async cancelInstall(fileName: string): Promise<void> {
        if (!fileName) {
            return;
        }
        const referenced = PluginConfigManager.getAllItems().some(c => c.fileName === fileName);
        if (referenced) {
            return;
        }
        const filePath = this.getScriptFilePath(fileName);
        try {
            if (existsSync(filePath)) {
                await fsp.unlink(filePath);
            }
            delete require.cache[require.resolve(filePath)];
        } catch (error) {
            logger.warn(`Failed to delete cancelled install ${fileName}`, error);
        }
    }

    /**
     * Called by PluginConfigManager when a config is deleted, so we can stop the
     * plugin and remove the underlying script file if no other config references it.
     */
    async onPluginConfigDeleted(pluginConfig: InstalledPluginConfig): Promise<void> {
        await this.stopPlugin(pluginConfig.id, true);

        const stillReferenced = PluginConfigManager
            .getAllItems()
            .some(c => c.fileName === pluginConfig.fileName);
        if (!stillReferenced) {
            const filePath = this.getScriptFilePath(pluginConfig.fileName);
            try {
                if (existsSync(filePath)) {
                    await fsp.unlink(filePath);
                }
            } catch (error) {
                logger.warn(`Failed to delete script file for ${pluginConfig.fileName}`, error);
            }
        }
    }

    /**
     * Replace the underlying script file for an existing plugin config with a new file
     * chosen on disk. Fires `onUnload` for the previous version, clears its require cache,
     * swaps the file (deleting the old one when the name changes), then re-starts the
     * plugin so the new code is picked up dynamically.
     */
    async updatePluginFromPath(
        pluginId: string,
        sourcePath: string,
        overwrite = false
    ): Promise<GetScriptDetailsResult | { success: false, error: string, conflict?: boolean }> {
        const config = PluginConfigManager.getItem(pluginId);
        if (!config) {
            return { success: false, error: "Plugin not found." };
        }

        if (!sourcePath || typeof sourcePath !== "string") {
            return { success: false, error: "Invalid file path." };
        }

        if (path.extname(sourcePath).toLowerCase() !== ".js") {
            return { success: false, error: "Only .js script files are supported." };
        }

        if (!existsSync(sourcePath)) {
            return { success: false, error: "Selected file does not exist." };
        }

        const oldFileName = config.fileName;
        const newFileName = path.basename(sourcePath);
        const oldFilePath = this.getScriptFilePath(oldFileName);
        const newFilePath = this.getScriptFilePath(newFileName);
        const fileNameChanged = newFileName !== oldFileName;
        const destFolder = ProfileManager.getPathInProfile("/scripts");

        // If renaming and the target name already belongs to another plugin / collides, ask the user.
        if (fileNameChanged && existsSync(newFilePath) && !overwrite) {
            return {
                success: false,
                error: `A script named '${newFileName}' already exists in the scripts folder.`,
                conflict: true
            };
        }

        // 1. Stop the running plugin first. This invokes onUnload for the old script,
        //    clears it from require.cache, and removes it from activePlugins.
        await this.stopPlugin(pluginId, false);

        // 2. Back up the existing file so we can roll back on validation failure.
        let backupPath: string | null = null;
        if (existsSync(oldFilePath)) {
            backupPath = `${oldFilePath}.bak-${Date.now()}`;
            try {
                await fsp.rename(oldFilePath, backupPath);
            } catch (error) {
                backupPath = null;
                logger.warn(`Failed to back up ${oldFileName} before update`, error);
            }
        }

        // 3. Copy the new file in.
        try {
            await fsp.mkdir(destFolder, { recursive: true });
            await fsp.copyFile(sourcePath, newFilePath);
        } catch (error) {
            // Restore backup, then bail.
            if (backupPath) {
                try {
                    await fsp.rename(backupPath, oldFilePath);
                } catch {
                    // best-effort
                }
            }
            await this.startPlugin(config, false).catch(() => undefined);
            return { success: false, error: `Failed to copy script: ${(error as Error).message}` };
        }

        // 4. Validate the new file is a recognizable plugin.
        const details = await this.getScriptDetailsByFileName(newFileName);
        if (details.success === false || details.scriptType !== "plugin") {
            // Remove the bad new file, restore backup, restart old plugin.
            try {
                await fsp.unlink(newFilePath);
            } catch {
                // best-effort
            }
            if (backupPath) {
                try {
                    await fsp.rename(backupPath, oldFilePath);
                } catch (error) {
                    logger.warn(`Failed to restore backup for ${oldFileName}`, error);
                }
            }
            await this.startPlugin(config, false).catch(() => undefined);
            return details.success === false
                ? details
                : { success: false, error: "Selected file is not a plugin." };
        }

        // 5. New file looks valid. Drop the old file (if renamed and nothing else uses it).
        if (fileNameChanged && backupPath) {
            const stillReferenced = PluginConfigManager
                .getAllItems()
                .some(c => c.id !== pluginId && c.fileName === oldFileName);
            try {
                if (stillReferenced) {
                    // Another plugin still uses the old file name — put it back.
                    await fsp.rename(backupPath, oldFilePath);
                } else {
                    await fsp.unlink(backupPath);
                }
            } catch (error) {
                logger.warn(`Cleanup of old script ${oldFileName} failed`, error);
            }
        } else if (backupPath && !fileNameChanged) {
            // Same name — backup served its purpose, drop it.
            try {
                await fsp.unlink(backupPath);
            } catch {
                // best-effort
            }
        }

        // 6. Persist the (possibly renamed) config and start the new plugin.
        config.fileName = newFileName;
        PluginConfigManager.saveItem(config);
        await this.startPlugin(config, false);

        return details;
    }

    // #endregion

    // #region Effect script execution
    async runEffectScript(
        effectData: {
            scriptName: string;
            parameters?: Record<string, unknown>;
        },
        trigger?: Trigger
    ): Promise<EffectScriptExecutionResult | undefined> {
        if (!SettingsManager.getSetting("RunCustomScripts")) {
            frontendCommunicator.send(
                "error",
                "Something attempted to run a custom script but this feature is disabled!"
            );
            return undefined;
        }

        const { scriptName } = effectData;
        if (!scriptName) {
            return { success: false, error: "No script selected." };
        }

        const scriptFilePath = this.getScriptFilePath(scriptName);
        if (!existsSync(scriptFilePath)) {
            frontendCommunicator.send("error", `Custom script '${scriptName}' was not found.`);
            return { success: false, error: "Script file not found" };
        }

        const willReloadModule = SettingsManager.getSetting("ClearCustomScriptCache")
            || !require.cache[require.resolve(scriptFilePath)];
        if (willReloadModule) {
            await this.disposeEffectScriptApi(scriptName);
        }

        let pendingApi: ScriptApiInstance | undefined;
        if (!this.effectScriptApiInstances.has(scriptName)) {
            pendingApi = this.createApiInstance({ kind: "effect-script", fileName: scriptName });
            this.pendingApiInstances.set(scriptName, pendingApi);
        }

        const script = this.loadScript(scriptFilePath);
        if (!script) {
            if (pendingApi) {
                await pendingApi.disposeBag.drain();
                this.pendingApiInstances.delete(scriptName);
            }
            return { success: false, error: "Could not load script" };
        }

        let chosen: IEffectScriptExecutor | undefined;
        for (const executor of this.effectScriptExecutors) {
            if (await executor.canHandle(script)) {
                chosen = executor;
                break;
            }
        }

        if (!chosen) {
            if (pendingApi) {
                await pendingApi.disposeBag.drain();
                this.pendingApiInstances.delete(scriptName);
            }
            frontendCommunicator.send(
                "error",
                `Error running '${scriptName}', script does not contain an exported 'run' function or valid manifest.`
            );
            return { success: false, error: "No effect executor matched" };
        }

        if (pendingApi) {
            this.pendingApiInstances.delete(scriptName);
            if (chosen instanceof EffectScriptExecutor) {
                // New-spec: keep the API and populate its manifest.
                pendingApi.setManifest((script as ScriptBase).manifest);
                this.effectScriptApiInstances.set(scriptName, pendingApi);
            } else {
                // Legacy effect script: uses the old runRequest.modules shim
                // and never sees the new API.
                await pendingApi.disposeBag.drain();
            }
        }

        // For legacy run-script the manifest may declare startupOnly; honor that.
        if ((script as LegacyCustomScript).getScriptManifest) {
            try {
                const manifest = await (script as LegacyCustomScript).getScriptManifest();
                if (manifest?.startupOnly) {
                    frontendCommunicator.send(
                        "error",
                        `Could not run startup-only script "${manifest.name}" outside of Firebot startup.`
                    );
                    return { success: false, error: "Startup-only script invoked at runtime" };
                }
            } catch {
                // ignore
            }
        }

        const context: ScriptContext = {
            trigger: trigger ?? undefined,
            parameters: effectData.parameters ?? {}
        };

        try {
            return await chosen.executeScript(script, context);
        } catch (error) {
            logger.error(`Error running script '${scriptName}'`, error);
            return { success: false, error: (error as Error)?.message ?? "Error running script" };
        }
    }

    private async disposeEffectScriptApi(fileName: string): Promise<void> {
        const existing = this.effectScriptApiInstances.get(fileName);
        if (!existing) {
            return;
        }
        this.effectScriptApiInstances.delete(fileName);
        await existing.disposeBag.drain();
    }

    // #endregion

    // #region Internals

    private getScriptFilePath(fileName: string): string {
        const scriptsFolder = ProfileManager.getPathInProfile("/scripts");
        return path.resolve(scriptsFolder, fileName);
    }

    private async findPluginExecutor(script: LoadedScript): Promise<IPluginExecutor | undefined> {
        for (const executor of this.pluginExecutors) {
            if (await executor.canHandle(script)) {
                return executor;
            }
        }
        return undefined;
    }

    private installRequireInterceptor() {
        if (this.requireInterceptorInstalled) {
            return;
        }
        this.requireInterceptorInstalled = true;

        const scriptsFolder = path.resolve(ProfileManager.getPathInProfile("/scripts"));

        type LoadFn = (request: string, parent?: NodeJS.Module, isMain?: boolean) => unknown;
        const nodeModule = Module as unknown as { _load: LoadFn };
        const originalLoad = nodeModule._load;

        const manager = this;
        nodeModule._load = function patchedLoad(
            request: string,
            parent?: NodeJS.Module,
            isMain?: boolean
        ): unknown {
            if (request !== "@crowbartools/firebot-types") {
                return originalLoad.call(this, request, parent, isMain);
            }

            const parentPath = parent?.filename ? path.resolve(parent.filename) : null;
            if (!parentPath || !parentPath.startsWith(scriptsFolder + path.sep)) {
                // require("@crowbartools/firebot-types") from something other than a custom script - deny.
                return {};
            }

            const fileName = path.basename(parentPath);

            const instance = manager.activePluginsByFileName.get(fileName)?.apiInstance
                ?? manager.pendingApiInstances.get(fileName)
                ?? manager.effectScriptApiInstances.get(fileName);

            if (!instance) {
                // If we don't have an instance, this is likely an
                // isolated inspection load (loadScriptIsolated) or some other
                // out-of-band require
                return {};
            }

            // Expose the API so it works with both named and default imports
            return {
                __esModule: true,
                ...instance.api,
                default: instance.api
            };
        };
    }

    private createApiInstance(source: ScriptApiContextSource): ScriptApiInstance {
        const handle = createScriptApiContext(source);
        const api = buildScriptApi(handle.context);
        return {
            context: handle.context,
            disposeBag: handle.disposeBag,
            api,
            setManifest: handle.setManifest
        };
    }

    private loadScript(scriptFilePath: string): LoadedScript | null {
        try {
            if (SettingsManager.getSetting("ClearCustomScriptCache")) {
                delete require.cache[require.resolve(scriptFilePath)];
            }

            return require(scriptFilePath) as LoadedScript;
        } catch (error) {
            frontendCommunicator.send("error", `Error loading the script '${scriptFilePath}' \n\n ${error}`);
            logger.error(error);
            return null;
        }
    }

    /**
     * Hack to load a script without registering it in `require.cache`.
     *
     * Used for read-only inspection (manifest / parameter schema lookup) so that
     * loading a fresh copy of a script does not evict or replace the cached module
     * of a currently-running plugin is holding a reference to.
     */
    private loadScriptIsolated(scriptFilePath: string): LoadedScript | null {
        try {
            const src = readFileSync(scriptFilePath, "utf8");
            const ModuleCtor = Module as unknown as {
                new (id: string, parent?: NodeJS.Module): IsolatedModule;
                _nodeModulePaths(p: string): string[];
            };
            const isolatedModule = new ModuleCtor(scriptFilePath, module);
            isolatedModule.filename = scriptFilePath;
            isolatedModule.paths = ModuleCtor._nodeModulePaths(path.dirname(scriptFilePath));
            isolatedModule._compile(src, scriptFilePath);
            return isolatedModule.exports as LoadedScript;
        } catch (error) {
            frontendCommunicator.send("error", `Error loading the script '${scriptFilePath}' \n\n ${error}`);
            logger.error(error);
            return null;
        }
    }

    private async scriptCanBePlugin(s: LoadedScript): Promise<boolean> {
        for (const executor of this.pluginExecutors) {
            if (await executor.canHandle(s)) {
                return true;
            }
        }
        return false;
    }

    // #endregion
}

const scriptManager = new ScriptManager();

frontendCommunicator.onAsync("script-manager:get-installed-plugins", async () => {
    return await scriptManager.getInstalledPlugins();
});

frontendCommunicator.onAsync(
    "script-manager:get-script-details",
    async (data: { fileName: string, expectedScriptType?: ScriptType }) => {
        console.log("Getting script details for", data);
        try {
            const details = await scriptManager.getScriptDetailsByFileName(data.fileName, data.expectedScriptType);
            console.log("Got details", details);
            return details;
        } catch (error) {
            console.log("Error getting script details", error);
            return { success: false, error: "Failed to get script details" };
        }
    }
);

frontendCommunicator.onAsync(
    "plugin-manager:install-from-file",
    async (data: { filePath: string, overwrite?: boolean }) => {
        return await scriptManager.installScriptFromPath(data?.filePath, data?.overwrite === true);
    }
);

frontendCommunicator.onAsync(
    "plugin-manager:update-from-file",
    async (data: { pluginId: string, filePath: string, overwrite?: boolean }) => {
        return await scriptManager.updatePluginFromPath(
            data?.pluginId,
            data?.filePath,
            data?.overwrite === true
        );
    }
);

frontendCommunicator.onAsync(
    "plugin-manager:cancel-install",
    async (data: { fileName: string }) => {
        await scriptManager.cancelInstall(data?.fileName);
        return true;
    }
);

frontendCommunicator.onAsync(
    "plugin-manager:set-enabled",
    async (data: { id: string, enabled: boolean }) => {
        await scriptManager.setPluginEnabled(data?.id, data?.enabled === true);
        return true;
    }
);

frontendCommunicator.onAsync(
    "plugin-manager:reload",
    async (config: InstalledPluginConfig) => {
        await scriptManager.reloadPluginConfig(config);
        return true;
    }
);

PluginConfigManager.on("updated-item", async (config) => {
    await scriptManager.reloadPluginConfig(config);
});

PluginConfigManager.on("deleted-item", async (config) => {
    await scriptManager.onPluginConfigDeleted(config);
});

export default scriptManager;
export { ScriptManager };
