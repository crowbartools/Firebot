import path from "path";
import { promises as fsp, existsSync, readFileSync } from "fs";
import Module from "module";
import { randomUUID } from "crypto";

import type {
    InstalledPlugin,
    InstalledPluginConfig,
    LegacyCustomScript,
    Manifest,
    PluginBase,
    PluginContext,
    PluginDetails,
    PluginType,
    Trigger
} from "../../types";
import type { FirebotPluginApi } from "../../types/plugin-api";

import { ProfileManager } from "../common/profile-manager";
import { LoggerCache } from "../logger-cache";
import frontendCommunicator from "../common/frontend-communicator";
import { SettingsManager } from "../common/settings-manager";
import { PluginConfigManager } from "./plugin-config-manager";
import webhookConfigManager from "../webhooks/webhook-config-manager";

import { PluginExecutor } from "./executors/plugin-executor";
import { LegacyStartUpScript } from "./executors/legacy-startup-script-executor";
import { LegacyEffectScriptExecutor } from "./executors/legacy-effect-script-executor";
import {
    EffectScriptExecutionResult,
    IPluginExecutor,
    PluginRegistrations,
    PluginExecutionResult
} from "./executors/plugin-executor.interface";
import { buildPluginApi, createPluginApiContext } from "./plugin-api";
import type { PluginApiContext, PluginApiContextSource } from "./plugin-api";
import type { DisposeBag } from "./plugin-api/internal/dispose-bag";

const logger = LoggerCache.getLogger("Plugins");

type LoadedPlugin = PluginBase | LegacyCustomScript;
type AnyPluginExecutor = IPluginExecutor;

interface IsolatedModule {
    filename: string;
    paths: string[];
    exports: { default?: unknown };
    _compile(src: string, filename: string): void;
}

interface ActivePluginEntry {
    plugin: LoadedPlugin;
    config: InstalledPluginConfig;
    executor: AnyPluginExecutor;
    registrations: PluginRegistrations;
    manifest: Manifest;
    fileName: string;
    apiInstance: PluginApiInstance;
}

interface PluginApiInstance {
    context: PluginApiContext;
    disposeBag: DisposeBag;
    api: FirebotPluginApi;
}

type GetPluginDetailsResult = {
    success: true;
    fileName: string;
    pluginType: "plugin" | "script";
    details: PluginDetails;
} | {
    success: false;
    error: string;
};

class PluginManager {
    private startingPlugins: Map<string, Promise<void>> = new Map();
    private activePlugins: Record<string, ActivePluginEntry> = {};

    private pendingApiInstances: Map<string, PluginApiInstance> = new Map();

    private requireInterceptorInstalled = false;

    private pluginExecutors: IPluginExecutor[] = [
        new PluginExecutor(),
        new LegacyStartUpScript()
    ];

    private legacyEffectScriptExecutor = new LegacyEffectScriptExecutor();

    constructor() {
        this.installRequireInterceptor();
    }

    async migrateLegacyStartUpScriptsToPlugins() {
        const hasMigrated = SettingsManager.getSetting("MigratedLegacyStartUpScriptsToPlugins");
        if (hasMigrated) {
            return;
        }

        if (!ProfileManager.profileDataPathExistsSync("startup-scripts-config.json")) {
            SettingsManager.saveSetting("MigratedLegacyStartUpScriptsToPlugins", true);
            return;
        }

        const startUpScriptsDb = ProfileManager
            .getJsonDbInProfile("startup-scripts-config");


        type StartUpScriptData = Record<string, {
            id: string;
            name: string;
            scriptName: string;
            parameters?: Record<string, { value: string }>;
        }>;

        const startupScriptsData: StartUpScriptData | undefined = startUpScriptsDb.getData("/") as unknown as StartUpScriptData;

        logger.info("Migrating start up scripts to plugins");

        if (startupScriptsData) {
            for (const script of Object.values(startupScriptsData)) {
                try {
                    // Create new entry
                    PluginConfigManager.saveItem({
                        id: script.id,
                        fileName: script.scriptName,
                        enabled: true,
                        legacyImport: true,
                        parameters: Object.entries(script.parameters ?? {}).reduce<Record<string, unknown>>((acc, [paramKey, param]) => {
                            acc[paramKey] = param?.value;
                            return acc;
                        }, {})
                    });

                    // Load manifest
                    const fullScriptPath = this.getPluginFilePath(script.scriptName);
                    const loadedScript = this.loadPluginIsolated(fullScriptPath);
                    const scriptManifest = await (loadedScript as LegacyCustomScript).getScriptManifest();
                    const scriptNameNormalized = scriptManifest.name.replace(/[#%&{}\\<>*?/$!'":@`|=\s-]+/g, "-").toLowerCase();

                    // Migrate webhooks
                    const existingWebhooks = (webhookConfigManager.getAllItems() ?? [])
                        .filter(h => h.scriptId === scriptNameNormalized);

                    for (const webhook of existingWebhooks) {
                        webhookConfigManager.saveItem({
                            id: webhook.id,
                            name: webhook.name,
                            scriptId: script.id
                        });
                    }
                } catch (error) {
                    logger.error(`Failed to migrate start up script ${script.id}: ${error}`);
                }
            }
        }

        // eslint-disable-next-line no-warning-comments
        // TODO: in a future version we can uncomment the following to clean up old start up script data after migration has been out for a while

        // this.logger.info("Deleting start up scripts database");
        // ProfileManager.deletePathInProfile("startup-scripts-config.json");

        SettingsManager.saveSetting("MigratedLegacyStartUpScriptsToPlugins", true);

        logger.info("Start up scripts migration complete");
    }

    // #region Plugin lifecycle

    async startPlugin(pluginConfig: InstalledPluginConfig, installing?: boolean): Promise<void> {
        if (pluginConfig.enabled === false) {
            return;
        }

        // guard against double loading the same plugin
        const existingStart = this.startingPlugins.get(pluginConfig.id);
        if (existingStart != null) {
            return existingStart;
        }

        const startPromise = this.doStartPlugin(pluginConfig, installing)
            .finally(() => {
                this.startingPlugins.delete(pluginConfig.id);
            });
        this.startingPlugins.set(pluginConfig.id, startPromise);
        return startPromise;
    }

    private async doStartPlugin(pluginConfig: InstalledPluginConfig, installing?: boolean): Promise<void> {
        if (this.activePlugins[pluginConfig.id]) {
            logger.warn(`Plugin ${pluginConfig.fileName} is already loaded.`);
            return;
        }

        // Guard against two different plugin configs pointing at the same plugin file
        const existingForFile = this.getActivePluginByFileName(pluginConfig.fileName);
        if (existingForFile) {
            logger.warn(`Cannot start plugin ${pluginConfig.fileName}: another plugin (${existingForFile.config.id}) is already running from the same script file.`);
            return;
        }

        const pluginFilePath = this.getPluginFilePath(pluginConfig.fileName);


        const detailsResult = await this.getPluginDetailsByFileName(pluginConfig.fileName, "plugin");
        if (detailsResult.success === false) {
            logger.warn(`Could not get details for plugin ${pluginConfig.fileName}: ${detailsResult.error}`);
            return;
        }

        const apiInstance = this.createApiInstance({ kind: "plugin", config: pluginConfig, manifest: detailsResult.details.manifest, isInspecting: false });
        this.pendingApiInstances.set(pluginConfig.fileName, apiInstance);

        const plugin = this.loadPlugin(pluginFilePath);
        if (!plugin) {
            await apiInstance.disposeBag.drain();
            this.pendingApiInstances.delete(pluginConfig.fileName);
            return;
        }

        if (!(await this.isValidPlugin(plugin))) {
            logger.warn(`Plugin ${pluginConfig.fileName} is not a valid plugin.`);
            await apiInstance.disposeBag.drain();
            this.pendingApiInstances.delete(pluginConfig.fileName);
            delete require.cache[require.resolve(pluginFilePath)];
            return;
        }

        const executor = await this.findPluginExecutor(plugin);
        if (!executor) {
            logger.warn(`No plugin executor found for ${pluginConfig.fileName}.`);
            await apiInstance.disposeBag.drain();
            this.pendingApiInstances.delete(pluginConfig.fileName);
            delete require.cache[require.resolve(pluginFilePath)];
            return;
        }

        let result: PluginExecutionResult;
        try {
            result = await executor.executePlugin(plugin, pluginConfig, installing, apiInstance.context);
        } catch (error) {
            result = { success: false as const, error: (error as Error)?.message ?? "Unknown error" };
        }

        if (result.success === true) {
            this.activePlugins[pluginConfig.id] = {
                plugin: plugin,
                config: pluginConfig,
                executor,
                registrations: result.registrations ?? {},
                fileName: pluginConfig.fileName,
                apiInstance,
                manifest: detailsResult.details.manifest
            };
            this.pendingApiInstances.delete(pluginConfig.fileName);
            logger.info(`Started plugin ${pluginConfig.fileName}`);
        } else {
            logger.warn(`Could not start plugin ${pluginConfig.fileName}: ${result.error}`);
            await apiInstance.disposeBag.drain();
            this.pendingApiInstances.delete(pluginConfig.fileName);
            delete require.cache[require.resolve(pluginFilePath)];
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
            await active.executor.unloadPlugin(active.plugin, active.config, active.registrations, uninstalling);
        } catch (error) {
            logger.error(`Error while unloading plugin ${active.fileName}`, error);
        }

        try {
            const pluginFilePath = this.getPluginFilePath(active.fileName);
            delete require.cache[require.resolve(pluginFilePath)];
        } catch (error) {
            logger.warn(`Could not clear require cache for plugin ${active.fileName}`, error);
        }

        await active.apiInstance.disposeBag.drain();

        delete this.activePlugins[pluginId];
        logger.info(`Stopped plugin ${active.fileName}`);
    }

    /**
     * Convenience helper for hot-reloading. Finds an active plugin by its plugin file
     * name and restarts it (stop then start). Does nothing if no active plugin matches.
     */
    async restartPluginByFileName(fileName: string): Promise<void> {
        if (!fileName) {
            return;
        }

        const active = this.getActivePluginByFileName(fileName);
        if (!active) {
            return;
        }

        const { id } = active.config;

        await this.stopPlugin(id, false);

        const config = PluginConfigManager.getItem(id);
        if (!config) {
            return;
        }

        await this.startPlugin(config, false);

        frontendCommunicator.send("plugin-manager:refresh-plugins");
    }

    async stopAllPlugins(): Promise<void> {
        logger.info("Stopping all plugins...");
        for (const id of Object.keys(this.activePlugins)) {
            await this.stopPlugin(id, false);
        }
        logger.info("Stopped all plugins");
    }

    /**
     * Handle a config change. Starts/stops as needed, and on a still-enabled plugin
     * either re-loads (if file may have changed) or invokes onParameterUpdate.
     */
    async reloadPluginConfig(pluginConfig: InstalledPluginConfig, isNewInstall = false): Promise<void> {
        const active = this.activePlugins[pluginConfig.id];

        // Disabled now -> stop if running
        if (pluginConfig.enabled === false) {
            if (active) {
                await this.stopPlugin(pluginConfig.id, false);
            }
            return;
        }

        // Enabled, not yet running -> start
        if (!active) {
            await this.startPlugin(pluginConfig, isNewInstall);
            return;
        }

        // Enabled, already running -> update config + notify
        active.config = pluginConfig;
        try {
            await active.executor.updateParameters?.(active.plugin, pluginConfig);
        } catch (error) {
            logger.error(`Error during updateParameters for ${active.fileName}`, error);
        }

        frontendCommunicator.send("plugin-manager:refresh-plugins");
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
            const pluginFilePath = this.getPluginFilePath(pluginConfig.fileName);
            // Use the isolated loader so inspecting a plugin (e.g. for the list UI)
            // cannot disturb the cached module a running plugin is holding.
            const plugin = this.loadPluginIsolated(pluginFilePath);

            if (!plugin || !(await this.isValidPlugin(plugin))) {
                if (plugin) {
                    logger.warn(`Plugin ${pluginConfig.fileName} is not a valid plugin.`);
                }
                continue;
            }

            const executor = await this.findPluginExecutor(plugin);
            if (!executor) {
                continue;
            }

            try {
                const details = await executor.getPluginDetails(plugin);
                if (details) {
                    installedPlugins.push({ config: pluginConfig, details });
                }
            } catch (error) {
                logger.warn(`Error reading details for ${pluginConfig.fileName}`, error);
            }
        }

        return installedPlugins;
    }

    private async doGetPluginDetailsByFileName(fileName: string, expectedPluginType?: PluginType): Promise<GetPluginDetailsResult> {
        const pluginFilePath = this.getPluginFilePath(fileName);
        if (!existsSync(pluginFilePath)) {
            return { success: false, error: "Plugin file does not exist" };
        }

        const plugin = this.loadPluginIsolated(pluginFilePath);
        if (!plugin) {
            return { success: false, error: "Could not load plugin" };
        }

        // Try plugin executors first (covers new-spec plugins + legacy startup scripts)
        for (const executor of this.pluginExecutors) {
            if (await executor.canHandle(plugin)) {
                if (expectedPluginType && expectedPluginType !== "plugin") {
                    return { success: false, error: `Only ${expectedPluginType}s are allowed.` };
                }
                const details = await executor.getPluginDetails(plugin);
                if (details) {
                    return { success: true, fileName, pluginType: "plugin", details };
                }
            }
        }

        // Check if plugin is legacy effect script
        if (await this.legacyEffectScriptExecutor.canHandle(plugin)) {
            if (expectedPluginType && expectedPluginType !== "script") {
                return { success: false, error: `Only ${expectedPluginType}s are allowed.` };
            }
            const details = await this.legacyEffectScriptExecutor.getScriptDetails(plugin);
            if (details) {
                return { success: true, fileName, pluginType: "script", details };
            }
        }

        return { success: false, error: "Plugin does not match any known plugin format" };
    }

    /**
     * Loads a plugin file (without persisting a config) and returns its details for
     * the install / edit UI.
     */
    async getPluginDetailsByFileName(fileName: string, expectedPluginType?: PluginType): Promise<GetPluginDetailsResult> {
        /**
         * Create a temporary API instance for this plugin
         */
        const contextSource: PluginApiContextSource = {
            kind: "plugin",
            config: { fileName, id: randomUUID(), parameters: {} },
            manifest: { author: "Unknown", name: fileName, version: "0.0.0", description: "" },
            isInspecting: true
        };

        const apiInstance = this.createApiInstance(contextSource);

        this.pendingApiInstances.set(fileName, apiInstance);

        const result = await this.doGetPluginDetailsByFileName(fileName, expectedPluginType);

        this.pendingApiInstances.delete(fileName);
        await apiInstance.disposeBag.drain();

        return result;
    }

    /**
     * Validates a file at any path on disk and copies it into the scripts folder.
     * Does NOT persist an InstalledPluginConfig — caller does that on save.
     */
    async installPluginFromPath(
        sourcePath: string,
        overwrite = false
    ): Promise<GetPluginDetailsResult | { success: false, error: string, conflict?: boolean }> {
        if (!sourcePath || typeof sourcePath !== "string") {
            return { success: false, error: "Invalid file path." };
        }

        if (path.extname(sourcePath).toLowerCase() !== ".js") {
            return { success: false, error: "Only .js plugin files are supported." };
        }

        if (!existsSync(sourcePath)) {
            return { success: false, error: "Selected file does not exist." };
        }

        const fileName = path.basename(sourcePath);
        const destFolder = ProfileManager.getPathInProfile("/scripts");
        const destPath = path.resolve(destFolder, fileName);

        // If the selected file is already inside the scripts folder,
        // there's nothing to do - just validate and return details.
        const sourceIsInScriptsFolder = path.resolve(sourcePath) === destPath;
        if (sourceIsInScriptsFolder) {
            return this.getPluginDetailsByFileName(fileName);
        }

        if (existsSync(destPath) && !overwrite) {
            return { success: false, error: `A plugin named '${fileName}' already exists in the scripts folder.`, conflict: true };
        }

        // copy then load, and if it doesn't validate, remove the copy.
        try {
            await fsp.mkdir(destFolder, { recursive: true });
            await fsp.copyFile(sourcePath, destPath);
        } catch (error) {
            return { success: false, error: `Failed to copy plugin: ${(error as Error).message}` };
        }

        const details = await this.getPluginDetailsByFileName(fileName);
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
     * Delete a copied plugin file that the user cancelled installing, but only
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
        const filePath = this.getPluginFilePath(fileName);
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
     * plugin.
     */
    async onPluginConfigDeleted(pluginConfig: InstalledPluginConfig): Promise<void> {
        await this.stopPlugin(pluginConfig.id, true);
    }

    async deletePluginFileIfUnreferenced(fileName: string): Promise<void> {
        const stillReferenced = PluginConfigManager
            .getAllItems()
            .some(c => c.fileName === fileName);
        if (stillReferenced) {
            return;
        }
        const filePath = this.getPluginFilePath(fileName);
        try {
            if (existsSync(filePath)) {
                await fsp.unlink(filePath);
            }
        } catch (error) {
            logger.warn(`Failed to delete plugin file for ${fileName}`, error);
        }
    }

    /**
     * Remove an installed plugin. Stops the plugin and deletes its config, and
     * optionally deletes the underlying plugin file from the scripts folder.
     */
    async deletePlugin(pluginId: string, deletePluginFile = false): Promise<boolean> {
        const config = PluginConfigManager.getItem(pluginId);
        if (config == null) {
            return false;
        }

        const { fileName } = config;
        await this.stopPlugin(pluginId, true);
        PluginConfigManager.deleteItem(pluginId);

        if (deletePluginFile) {
            await this.deletePluginFileIfUnreferenced(fileName);
        }

        return true;
    }

    /**
     * Replace the underlying plugin file for an existing plugin config with a new file
     * chosen on disk.
     */
    async updatePluginFromPath(
        pluginId: string,
        sourcePath: string,
        overwrite = false
    ): Promise<GetPluginDetailsResult | { success: false, error: string, conflict?: boolean }> {
        const config = PluginConfigManager.getItem(pluginId);
        if (!config) {
            return { success: false, error: "Plugin not found." };
        }

        if (!sourcePath || typeof sourcePath !== "string") {
            return { success: false, error: "Invalid file path." };
        }

        if (path.extname(sourcePath).toLowerCase() !== ".js") {
            return { success: false, error: "Only .js plugin files are supported." };
        }

        if (!existsSync(sourcePath)) {
            return { success: false, error: "Selected file does not exist." };
        }

        const oldFileName = config.fileName;
        const newFileName = path.basename(sourcePath);
        const oldFilePath = this.getPluginFilePath(oldFileName);
        const newFilePath = this.getPluginFilePath(newFileName);
        const fileNameChanged = newFileName !== oldFileName;
        const destFolder = ProfileManager.getPathInProfile("/scripts");

        if (oldFilePath === newFilePath) {
            return { success: false, error: "Selected file is the same as the current plugin." };
        }

        // If renaming and the target name already belongs to another plugin / collides, ask the user.
        if (fileNameChanged && existsSync(newFilePath) && !overwrite) {
            return {
                success: false,
                error: `A plugin file named '${newFileName}' already exists in the scripts folder.`,
                conflict: true
            };
        }

        // 1. Stop the running plugin first. This invokes onUnload for the old plugin,
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
            return { success: false, error: `Failed to copy plugin: ${(error as Error).message}` };
        }

        // 4. Validate the new file is a recognizable plugin.
        const details = await this.getPluginDetailsByFileName(newFileName);
        if (details.success === false || details.pluginType !== "plugin") {
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
                logger.warn(`Cleanup of old plugin ${oldFileName} failed`, error);
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

        const scriptFilePath = this.getPluginFilePath(scriptName);
        if (!existsSync(scriptFilePath)) {
            frontendCommunicator.send("error", `Custom script '${scriptName}' was not found.`);
            return { success: false, error: "Script file not found" };
        }

        const detailsResult = await this.getPluginDetailsByFileName(scriptName, "script");
        if (detailsResult.success === false) {
            logger.warn(`Could not get details for effect script ${scriptName}: ${detailsResult.error}`);
            return { success: false, error: "Could not load script details" };
        }

        const script = this.loadPlugin(scriptFilePath);
        if (!script) {
            return { success: false, error: "Could not load script" };
        }

        const canHandle = await this.legacyEffectScriptExecutor.canHandle(script);

        if (!canHandle) {
            frontendCommunicator.send(
                "error",
                `Error running '${scriptName}', script does not contain an exported 'run' function or valid manifest.`
            );
            return { success: false, error: "No effect executor matched" };
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

        const context: PluginContext = {
            trigger: trigger ?? undefined,
            parameters: effectData.parameters ?? {}
        };

        try {
            return await this.legacyEffectScriptExecutor.executeScript(script, context);
        } catch (error) {
            logger.error(`Error running script '${scriptName}'`, error);
            return { success: false, error: (error as Error)?.message ?? "Error running script" };
        }
    }

    // #endregion

    // #region Internals

    private getPluginFilePath(fileName: string): string {
        const scriptsFolder = ProfileManager.getPathInProfile("/scripts");
        return path.resolve(scriptsFolder, fileName);
    }

    private getActivePluginByFileName(fileName: string): ActivePluginEntry | undefined {
        return Object.values(this.activePlugins).find(entry => entry.fileName === fileName);
    }

    private async findPluginExecutor(plugin: LoadedPlugin): Promise<IPluginExecutor | undefined> {
        for (const executor of this.pluginExecutors) {
            if (await executor.canHandle(plugin)) {
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

            const instance = manager.getActivePluginByFileName(fileName)?.apiInstance
                ?? manager.pendingApiInstances.get(fileName);

            if (!instance) {
                // If we don't have an instance, this is likely an
                // isolated inspection load (loadPluginIsolated) or some other
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

    private createApiInstance(source: PluginApiContextSource): PluginApiInstance {
        const handle = createPluginApiContext(source);
        const api = buildPluginApi(handle.context);
        return {
            context: handle.context,
            disposeBag: handle.disposeBag,
            api
        };
    }

    private loadPlugin(pluginFilePath: string): LoadedPlugin | null {
        try {
            delete require.cache[require.resolve(pluginFilePath)];

            const loadedPlugin = require(pluginFilePath) as { default: unknown };

            return (loadedPlugin?.default ?? loadedPlugin) as LoadedPlugin;
        } catch (error) {
            frontendCommunicator.send("error", `Error loading the plugin '${pluginFilePath}' \n\n ${error}`);
            logger.error(error);
            return null;
        }
    }

    /**
     * Hack to load a plugin without registering it in `require.cache`.
     *
     * Used for read-only inspection (manifest / parameter schema lookup) so that
     * loading a fresh copy of a plugin does not evict or replace the cached module
     * of a currently-running plugin is holding a reference to.
     */
    private loadPluginIsolated(pluginFilePath: string): LoadedPlugin | null {
        try {
            const src = readFileSync(pluginFilePath, "utf8");
            const ModuleCtor = Module as unknown as {
                new (id: string, parent?: NodeJS.Module): IsolatedModule;
                _nodeModulePaths(p: string): string[];
            };
            const isolatedModule = new ModuleCtor(pluginFilePath, module);
            isolatedModule.filename = pluginFilePath;
            isolatedModule.paths = ModuleCtor._nodeModulePaths(path.dirname(pluginFilePath));
            isolatedModule._compile(src, pluginFilePath);
            return (isolatedModule.exports?.default ?? isolatedModule.exports) as LoadedPlugin;
        } catch (error) {
            frontendCommunicator.send("error", `Error loading the plugin '${pluginFilePath}' \n\n ${error}`);
            logger.error(error);
            return null;
        }
    }

    private async isValidPlugin(s: LoadedPlugin): Promise<boolean> {
        for (const executor of this.pluginExecutors) {
            if (await executor.canHandle(s)) {
                return true;
            }
        }
        return false;
    }

    // #endregion
}

const pluginManager = new PluginManager();

frontendCommunicator.onAsync("plugin-manager:get-installed-plugins", async () => {
    return await pluginManager.getInstalledPlugins();
});

frontendCommunicator.onAsync(
    "plugin-manager:get-plugin-details",
    async (data: { fileName: string, expectedPluginType?: PluginType }) => {
        console.log("Getting plugin details for", data);
        try {
            const details = await pluginManager.getPluginDetailsByFileName(data.fileName, data.expectedPluginType);
            console.log("Got details", details);
            return details;
        } catch (error) {
            console.log("Error getting plugin details", error);
            return { success: false, error: "Failed to get plugin details" };
        }
    }
);

frontendCommunicator.onAsync("plugin-manager:save-config", async ({ pluginConfig, isNewInstall = false }: { pluginConfig: InstalledPluginConfig, isNewInstall?: boolean }) => {
    const newConfig = PluginConfigManager.saveItem(pluginConfig);
    await pluginManager.reloadPluginConfig(newConfig, isNewInstall);
    return newConfig;
});

frontendCommunicator.onAsync(
    "plugin-manager:install-from-file",
    async (data: { filePath: string, overwrite?: boolean }) => {
        return await pluginManager.installPluginFromPath(data?.filePath, data?.overwrite === true);
    }
);

frontendCommunicator.onAsync(
    "plugin-manager:update-from-file",
    async (data: { pluginId: string, filePath: string, overwrite?: boolean }) => {
        return await pluginManager.updatePluginFromPath(
            data?.pluginId,
            data?.filePath,
            data?.overwrite === true
        );
    }
);

frontendCommunicator.onAsync(
    "plugin-manager:cancel-install",
    async (data: { fileName: string }) => {
        await pluginManager.cancelInstall(data?.fileName);
        return true;
    }
);

frontendCommunicator.onAsync(
    "plugin-manager:set-enabled",
    async (data: { id: string, enabled: boolean }) => {
        await pluginManager.setPluginEnabled(data?.id, data?.enabled === true);
        return true;
    }
);

frontendCommunicator.onAsync(
    "plugin-manager:delete",
    async (data: string | { id: string, deletePluginFile?: boolean }) => {
        const id = typeof data === "string" ? data : data?.id;
        const deletePluginFile = typeof data !== "string" && data?.deletePluginFile === true;
        return pluginManager.deletePlugin(id, deletePluginFile);
    }
);

PluginConfigManager.on("deleted-item", async (config) => {
    await pluginManager.onPluginConfigDeleted(config);
});

export { pluginManager as PluginManager };