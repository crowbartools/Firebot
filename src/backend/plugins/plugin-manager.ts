import path from "path";
import { promises as fsp, existsSync, readFileSync } from "fs";
import Module from "module";
import { randomUUID, createHash } from "crypto";
import { app } from "electron";

import type {
    CommunityPluginSearchCriteria,
    CommunityPluginSearchResult,
    InstalledPlugin,
    InstalledPluginConfig,
    LegacyCustomScript,
    ManagedPlugin,
    ManagedPluginBase,
    ManagedPluginExtended,
    ManagedPluginUpdateRequest,
    Manifest,
    PluginBase,
    PluginContext,
    PluginDetails,
    PluginType,
    Trigger
} from "../../types";
import type { FirebotPluginApi } from "../../types/plugin-api";
import type { PluginApiContext, PluginApiContextSource } from "./plugin-api";
import type { DisposeBag } from "./plugin-api/internal/dispose-bag";

import { PluginConfigManager } from "./plugin-config-manager";
import { AccountAccess } from "../common/account-access";
import { ProfileManager } from "../common/profile-manager";
import { SettingsManager } from "../common/settings-manager";
import webhookConfigManager from "../webhooks/webhook-config-manager";
import { LoggerCache } from "../logger-cache";
import frontendCommunicator from "../common/frontend-communicator";

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
import { resolvePluginManifestLinks } from "./plugin-manifest-utils";
import { compareVersions, parseVersion, UpdateType } from "../../shared/compare-versions";
import { meetsFirebotVersionRequirement } from "../utils";

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

type PluginInstallResult = {
    success: true;
    installedPlugin: InstalledPlugin;
} | {
    success: false;
    error: string;
};

const COMMUNITY_PLUGIN_SERVICE_ROOT_URL = "https://api.crowbar.tools/v1/plugins/";

class PluginManager {
    private _logger = LoggerCache.getLogger("Plugins");

    private startingPlugins: Map<string, Promise<void>> = new Map();
    private activePlugins: Record<string, ActivePluginEntry> = {};

    private updateCheckInterval: NodeJS.Timeout;
    private pendingUpdates: Record<string, ManagedPlugin> = {};

    private pendingApiInstances: Map<string, PluginApiInstance> = new Map();

    private requireInterceptorInstalled = false;

    private pluginExecutors: IPluginExecutor[] = [
        new PluginExecutor(),
        new LegacyStartUpScript()
    ];

    private legacyEffectScriptExecutor = new LegacyEffectScriptExecutor();

    constructor() {
        this.installRequireInterceptor();

        PluginConfigManager.on("deleted-item", async (config) => {
            await this.onPluginConfigDeleted(config);
        });

        frontendCommunicator.onAsync("plugin-manager:ui-service-ready",
            async () => this.triggerUiRefresh()
        );

        frontendCommunicator.onAsync("plugin-manager:get-plugin-details",
            async (data: { fileName: string, expectedPluginType?: PluginType }) => {
                this._logger.debug("Getting plugin details for", data);
                try {
                    const details = await this.getPluginDetailsByFileName(data.fileName, data.expectedPluginType);
                    this._logger.debug("Got details", details);
                    return details;
                } catch (error) {
                    this._logger.debug("Error getting plugin details", error);
                    return { success: false, error: "Failed to get plugin details" };
                }
            }
        );

        frontendCommunicator.onAsync("plugin-manager:save-config",
            async ({ pluginConfig }: { pluginConfig: InstalledPluginConfig }) => {
                const newConfig = PluginConfigManager.saveItem(pluginConfig);
                await this.reloadPluginConfig(newConfig);
                return newConfig;
            }
        );

        frontendCommunicator.onAsync("plugin-manager:install-from-file",
            async (data: { filePath: string, overwrite?: boolean }) => {
                return await this.installPluginFromPath(data?.filePath, data?.overwrite === true);
            }
        );

        frontendCommunicator.onAsync("plugin-manager:update-from-file",
            async (data: { pluginId: string, filePath: string, overwrite?: boolean }) => {
                return await this.updatePluginFromPath(
                    data?.pluginId,
                    data?.filePath,
                    data?.overwrite === true
                );
            }
        );

        frontendCommunicator.onAsync("plugin-manager:set-enabled",
            async (data: { id: string, enabled: boolean }) => {
                await this.setPluginEnabled(data?.id, data?.enabled === true);
                return true;
            }
        );

        frontendCommunicator.onAsync("plugin-manager:delete",
            async (data: string | { id: string, deletePluginFile?: boolean }) => {
                const id = typeof data === "string" ? data : data?.id;
                const deletePluginFile = typeof data !== "string" && data?.deletePluginFile === true;
                return this.deletePlugin(id, deletePluginFile);
            }
        );

        frontendCommunicator.onAsync("plugin-manager:search-community-plugins",
            async (criteria: CommunityPluginSearchCriteria) => {
                return await this.searchForCommunityPlugins(criteria);
            }
        );

        frontendCommunicator.onAsync("plugin-manager:install-community-plugin",
            async (pluginDetails: ManagedPluginExtended) => {
                return await this.installCommunityPlugin(pluginDetails);
            }
        );

        frontendCommunicator.onAsync("plugin-manager:update-community-plugin",
            async (pluginId: string) => {
                return await this.updateCommunityPlugin(pluginId);
            }
        );
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

        this._logger.info("Migrating start up scripts to plugins");

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
                    this._logger.error(`Failed to migrate start up script ${script.id}: ${error}`);
                }
            }
        }

        // eslint-disable-next-line no-warning-comments
        // TODO: in a future version we can uncomment the following to clean up old start up script data after migration has been out for a while

        // this.this._logger.info("Deleting start up scripts database");
        // ProfileManager.deletePathInProfile("startup-scripts-config.json");

        SettingsManager.saveSetting("MigratedLegacyStartUpScriptsToPlugins", true);

        this._logger.info("Start up scripts migration complete");
    }

    async triggerUiRefresh(): Promise<void> {
        this._logger.debug("Triggering UI refresh");
        frontendCommunicator.send("plugin-manager:all-plugins", await this.getInstalledPlugins());
        frontendCommunicator.send("plugin-manager:community-plugin-updates", this.pendingUpdates);
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
            this._logger.warn(`Plugin ${pluginConfig.fileName} is already loaded.`);
            return;
        }

        // Guard against two different plugin configs pointing at the same plugin file
        const existingForFile = this.getActivePluginByFileName(pluginConfig.fileName);
        if (existingForFile) {
            this._logger.warn(`Cannot start plugin ${pluginConfig.fileName}: another plugin (${existingForFile.config.id}) is already running from the same script file.`);
            return;
        }

        const pluginFilePath = this.getPluginFilePath(pluginConfig.fileName);


        const detailsResult = await this.getPluginDetailsByFileName(pluginConfig.fileName, "plugin");
        if (detailsResult.success === false) {
            this._logger.warn(`Could not get details for plugin ${pluginConfig.fileName}: ${detailsResult.error}`);
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
            this._logger.warn(`Plugin ${pluginConfig.fileName} is not a valid plugin.`);
            await apiInstance.disposeBag.drain();
            this.pendingApiInstances.delete(pluginConfig.fileName);
            delete require.cache[require.resolve(pluginFilePath)];
            return;
        }

        const executor = await this.findPluginExecutor(plugin);
        if (!executor) {
            this._logger.warn(`No plugin executor found for ${pluginConfig.fileName}.`);
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
            this._logger.info(`Started plugin ${pluginConfig.fileName}`);
        } else {
            this._logger.warn(`Could not start plugin ${pluginConfig.fileName}: ${result.error}`);
            await apiInstance.disposeBag.drain();
            this.pendingApiInstances.delete(pluginConfig.fileName);
            delete require.cache[require.resolve(pluginFilePath)];
        }
    }

    async startPlugins(): Promise<void> {
        const pluginConfigs = PluginConfigManager.getAllItems();
        for (const pluginConfig of pluginConfigs) {
            if (pluginConfig.enabled !== false) {
                this._logger.info(`Starting plugin ${pluginConfig.fileName}`);
                await this.startPlugin(pluginConfig, false);
            }
        }
        this._logger.info("All plugins started");
    }

    async stopPlugin(pluginId: string, uninstalling = false): Promise<void> {
        const active = this.activePlugins[pluginId];
        if (!active) {
            return;
        }

        try {
            await active.executor.unloadPlugin(active.plugin, active.config, active.registrations, uninstalling);
        } catch (error) {
            this._logger.error(`Error while unloading plugin ${active.fileName}`, error);
        }

        try {
            const pluginFilePath = this.getPluginFilePath(active.fileName);
            delete require.cache[require.resolve(pluginFilePath)];
        } catch (error) {
            this._logger.warn(`Could not clear require cache for plugin ${active.fileName}`, error);
        }

        await active.apiInstance.disposeBag.drain();

        delete this.activePlugins[pluginId];
        this._logger.info(`Stopped plugin ${active.fileName}`);
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

        void this.triggerUiRefresh();
    }

    async stopAllPlugins(): Promise<void> {
        this._logger.info("Stopping all plugins...");
        for (const id of Object.keys(this.activePlugins)) {
            await this.stopPlugin(id, false);
        }
        this._logger.info("Stopped all plugins");
    }

    /**
     * Handle a config change. Starts/stops as needed, and on a still-enabled plugin
     * either re-loads (if file may have changed) or invokes onParameterUpdate.
     */
    async reloadPluginConfig(pluginConfig: InstalledPluginConfig): Promise<void> {
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
            await this.startPlugin(pluginConfig, false);
            return;
        }

        // Enabled, already running -> update config + notify
        active.config = pluginConfig;
        try {
            await active.executor.updateParameters?.(active.plugin, pluginConfig);
        } catch (error) {
            this._logger.error(`Error during updateParameters for ${active.fileName}`, error);
        }

        void this.triggerUiRefresh();
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
            try {
                const result = await this.getPluginDetailsByFileName(pluginConfig.fileName, "plugin");

                if (result.success === false) {
                    this._logger.warn(`Could not get details for plugin ${pluginConfig.fileName}: ${result.error}`);
                    continue;
                }

                installedPlugins.push({ config: pluginConfig, details: result.details });
            } catch (error) {
                this._logger.warn(`Error getting details for plugin ${pluginConfig.fileName}`, error);
                continue;
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
    ): Promise<PluginInstallResult | { success: false, error: string, conflict?: boolean }> {
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

        let details: GetPluginDetailsResult;

        // If the selected file is already inside the scripts folder,
        // there's nothing to do - just validate and return details.
        const sourceIsInScriptsFolder = path.resolve(sourcePath) === destPath;
        if (sourceIsInScriptsFolder) {
            details = await this.getPluginDetailsByFileName(fileName);
        } else {
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

            details = await this.getPluginDetailsByFileName(fileName);
            if (details.success === false) {
                try {
                    await fsp.unlink(destPath);
                } catch {
                    // best-effort
                }
                return details;
            }
        }

        if (details.success === true) {
            const defaultParams: Record<string, unknown> = {};
            for (const param of details.details.parametersSchema ?? []) {
                defaultParams[param.name] = param.default;
            }
            const installedPluginConfig: InstalledPluginConfig = {
                id: randomUUID(),
                fileName,
                enabled: true,
                parameters: defaultParams
            };

            PluginConfigManager.saveItem(installedPluginConfig);

            await this.startPlugin(installedPluginConfig, true);

            void this.triggerUiRefresh();

            return {
                success: true,
                installedPlugin: {
                    config: installedPluginConfig,
                    details: details.details
                }
            };
        }

        return {
            success: false,
            error: "Failed to install plugin. Check the log for more details."
        };
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
            this._logger.warn(`Failed to delete plugin file for ${fileName}`, error);
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

        void this.triggerUiRefresh();

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
                this._logger.warn(`Failed to back up ${oldFileName} before update`, error);
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
                    this._logger.warn(`Failed to restore backup for ${oldFileName}`, error);
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
                this._logger.warn(`Cleanup of old plugin ${oldFileName} failed`, error);
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
            this._logger.warn(`Could not get details for effect script ${scriptName}: ${detailsResult.error}`);
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
            this._logger.error(`Error running script '${scriptName}'`, error);
            return { success: false, error: (error as Error)?.message ?? "Error running script" };
        }
    }

    // #endregion

    // #region Internals

    private getPluginFilePath(fileName: string): string {
        if (fileName.startsWith(`plugins${path.sep}`)) {
            return path.resolve(ProfileManager.getPathInProfile(fileName));
        }

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

    private installRequireInterceptor(): void {
        if (this.requireInterceptorInstalled) {
            return;
        }
        this.requireInterceptorInstalled = true;

        const scriptsFolder = path.resolve(ProfileManager.getPathInProfile("/scripts"));
        const pluginsFolder = path.resolve(ProfileManager.getPathInProfile("/plugins"));

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
            if (!parentPath
                || (!parentPath.startsWith(scriptsFolder + path.sep)
                    && !parentPath.startsWith(pluginsFolder + path.sep))
            ) {
                // require("@crowbartools/firebot-types") from something other than a custom script - deny.
                return {};
            }

            let fileName = path.basename(parentPath);

            // Community plugins install to a separate nested file path
            if (parentPath.startsWith(pluginsFolder + path.sep)) {
                fileName = path.join("plugins", parentPath.replace(pluginsFolder + path.sep, ""));
            }

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
            this._logger.error(error);
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
            this._logger.error(error);
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

    // #region Managed (Community) Plugins

    private async searchForCommunityPlugins(criteria: CommunityPluginSearchCriteria): Promise<CommunityPluginSearchResult> {
        const plugins: ManagedPluginExtended[] = [];
        let total = 0;

        try {
            const firebotVersionString = app.getVersion();
            const body = {
                ...criteria,
                firebotVersion: parseVersion(firebotVersionString)
            };

            const response = await fetch(`${COMMUNITY_PLUGIN_SERVICE_ROOT_URL}search`, {
                method: "POST",
                body: JSON.stringify(body),
                headers: {
                    "User-Agent": `Firebot/${firebotVersionString}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const searchResult = await response.json() as { items: ManagedPlugin[], total: number };
                total = searchResult.total;

                for (const result of searchResult.items) {
                    const installedPlugin = PluginConfigManager.getAllItems().find(c =>
                        c.managedPluginDetails?.author === result.author
                        && c.managedPluginDetails?.name === result.name
                    );

                    plugins.push({
                        ...result,
                        installed: installedPlugin?.managedPluginDetails?.version != null,
                        installedVersion: installedPlugin?.managedPluginDetails?.version
                    });
                }
            } else {
                const responseBody = await response.text();

                this._logger.error(`Failed to search community plugins. Response: ${responseBody}`);
                frontendCommunicator.send("showToast", {
                    content: "Failed to search for community plugins. Check the log for more details.",
                    className: "warning"
                });
            }
        } catch (error) {
            this._logger.error("Failed to search community plugins", error);
            frontendCommunicator.send("showToast", {
                content: "Failed to search for community plugins. Check the log for more details.",
                className: "warning"
            });
        }

        for (const plugin of plugins) {
            plugin.manifest = resolvePluginManifestLinks(plugin.manifest);
        }

        return { items: plugins, total };
    }

    private trackCommunityPluginDownload(plugin: ManagedPluginBase): void {
        void (async () => {
            try {
                const streamer = AccountAccess.getAccounts().streamer;
                if (streamer?.loggedIn !== true) {
                    return;
                }

                await fetch(`${COMMUNITY_PLUGIN_SERVICE_ROOT_URL}track-download`, {
                    method: "POST",
                    body: JSON.stringify({
                        author: plugin.author,
                        name: plugin.name,
                        version: plugin.version
                    }),
                    headers: {
                        "User-Agent": `Firebot/${app.getVersion()}`,
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${streamer.auth.access_token}`
                    }
                });
            } catch (error) {
                this._logger.debug("Failed to track community plugin download", error);
            }
        })();
    }

    private async downloadAndSaveCommunityPlugin(
        plugin: ManagedPlugin
    ): Promise<{ success: boolean, path?: string }> {
        const result = {
            success: false,
            path: undefined
        };

        try {
            // Download the file
            const downloadResponse = await fetch(plugin.manifest.downloadUrl);

            if (!downloadResponse.ok) {
                const downloadResponseBody = await downloadResponse.text();
                this._logger.error(`Unable to download plugin file. Response: ${downloadResponseBody}`);
                return { success: false };
            }

            const fileContents = await downloadResponse.bytes();

            // Verify the SHA
            const hash = createHash("sha256").update(fileContents).digest("hex");
            if (hash.toLowerCase() !== plugin.manifest.sha256.toLowerCase()) {
                this._logger.error("Downloaded plugin signature doesn't match plugin manifest");
                return { success: false };
            }

            const pluginRelativePath = path.join(
                "plugins",
                plugin.author,
                plugin.name,
                plugin.version
            );
            const destFolder = ProfileManager.getPathInProfile(pluginRelativePath);

            switch (plugin.manifest.type) {
                case "single-file": {
                    await fsp.mkdir(destFolder, { recursive: true });
                    const destPath = path.resolve(destFolder, "plugin.js");

                    await fsp.writeFile(destPath, fileContents);
                    result.success = true;
                    result.path = path.join(pluginRelativePath, "plugin.js");
                    break;
                }

                case "zip": //TODO
                default:
                    this._logger.warn(`Unknown plugin type "${plugin.manifest.type}"`);
                    return result;
            }
        } catch (error) {
            this._logger.error("Failed to save community plugin", error);
            return result;
        }

        return result;
    }

    private async installCommunityPlugin(
        plugin: ManagedPluginExtended
    ): Promise<PluginInstallResult> {
        // Ensure we have data
        if (plugin == null) {
            const errorMessage = "No community plugin details provided for install";
            this._logger.error(errorMessage);
            return { success: false, error: errorMessage };
        }

        // Make sure it's not already installed
        if (plugin.installed === true) {
            const errorMessage = `Plugin ${plugin.manifest.name} is already installed (currently v${plugin.installedVersion})`;
            this._logger.warn(errorMessage);
            return { success: false, error: errorMessage };
        }

        try {
            // Check that plugin meets Firebot version spec
            const currentFirebotVersion = parseVersion(app.getVersion());
            const versionPassed = meetsFirebotVersionRequirement(
                currentFirebotVersion,
                plugin.manifest.minimumFirebotVersion,
                plugin.manifest.maximumFirebotVersion
            );

            if (versionPassed !== true) {
                const errorMessage = "Plugin is not designed to work with this version of Firebot";
                this._logger.error(errorMessage);
                return { success: false, error: errorMessage };
            }

            // Download and save the file
            const saveResult = await this.downloadAndSaveCommunityPlugin(plugin);

            if (saveResult.success !== true) {
                return { success: false, error: "Failed to download or save plugin" };
            }

            // Grab the plugin details
            const pluginDetails = await this.getPluginDetailsByFileName(saveResult.path, "plugin");
            if (pluginDetails.success !== true) {
                const errorMessage = "Failed to load plugin details";
                this._logger.error(errorMessage);

                try {
                    await fsp.rm(this.getPluginFilePath(saveResult.path), { force: true });
                } catch { }

                return { success: false, error: errorMessage };
            }

            const defaultParams: Record<string, unknown> = {};
            for (const param of pluginDetails.details.parametersSchema ?? []) {
                defaultParams[param.name] = param.default;
            }

            // And finally, save and start the plugin
            const installedPluginConfig: InstalledPluginConfig = {
                id: randomUUID(),
                enabled: true,
                fileName: saveResult.path,
                parameters: defaultParams,
                managedPluginDetails: {
                    author: plugin.author,
                    name: plugin.name,
                    version: plugin.version
                }
            };
            PluginConfigManager.saveItem(installedPluginConfig);

            await this.startPlugin(installedPluginConfig, true);

            void this.triggerUiRefresh();

            this.trackCommunityPluginDownload(plugin);

            return {
                success: true,
                installedPlugin: {
                    config: installedPluginConfig,
                    details: pluginDetails.details
                }
            };
        } catch (error) {
            this._logger.error(`Failed to install community plugin "${plugin.author}:${plugin.name}"`, error);
            return { success: false, error: "Installation failed. Check the log for more info." };
        }
    }

    private async updateCommunityPlugin(
        pluginId: string
    ): Promise<PluginInstallResult> {
        // Make sure existing plugin is valid
        const installedPluginConfig = PluginConfigManager.getItem(pluginId);

        if (installedPluginConfig == null) {
            const errorMessage = `Plugin ${pluginId} not found`;
            this._logger.warn(errorMessage);
            return { success: false, error: errorMessage };
        }

        if (installedPluginConfig.managedPluginDetails == null
            || !installedPluginConfig.managedPluginDetails.author?.length
            || !installedPluginConfig.managedPluginDetails.name?.length
            || !installedPluginConfig.managedPluginDetails.version?.length
        ) {
            const errorMessage = `Plugin ${pluginId} is not a community plugin`;
            this._logger.warn(errorMessage);
            return { success: false, error: errorMessage };
        }

        // Ensure we have data
        const pluginUpdate = this.pendingUpdates[pluginId];
        if (pluginUpdate == null) {
            const errorMessage = "No update available for community plugin";
            this._logger.error(errorMessage);
            return { success: false, error: errorMessage };
        }

        // Ensure it's the same plugin
        if (pluginUpdate.author !== installedPluginConfig.managedPluginDetails.author
            || pluginUpdate.name !== installedPluginConfig.managedPluginDetails.name
        ) {
            const errorMessage = "Update does not match installed plugin";
            this._logger.error(errorMessage);
            return { success: false, error: errorMessage };
        }

        // Ensure it's actually an upgrade
        const updateType = compareVersions(pluginUpdate.version, installedPluginConfig.managedPluginDetails.version);
        if (updateType === UpdateType.NONE || updateType === UpdateType.PREVIOUS_VERSION) {
            const errorMessage = "Installed plugin version is already up-to-date";
            this._logger.error(errorMessage);
            return { success: false, error: errorMessage };
        }

        try {
            // Download and save the update
            const saveResult = await this.downloadAndSaveCommunityPlugin(pluginUpdate);

            if (saveResult.success !== true) {
                return { success: false, error: "Failed to download or save plugin update" };
            }

            // Grab the update details
            const pluginDetails = await this.getPluginDetailsByFileName(saveResult.path, "plugin");
            if (pluginDetails.success !== true) {
                const errorMessage = "Failed to load plugin details";
                this._logger.error(errorMessage);

                try {
                    await fsp.rm(this.getPluginFilePath(saveResult.path), { force: true });
                } catch { }

                return { success: false, error: errorMessage };
            }

            // Stop the plugin, update the config with the new details, and restart it
            await this.stopPlugin(pluginId, false);

            installedPluginConfig.fileName = saveResult.path;
            installedPluginConfig.managedPluginDetails.version = pluginUpdate.version;
            PluginConfigManager.saveItem(installedPluginConfig);

            await this.startPlugin(installedPluginConfig, false);

            delete this.pendingUpdates[pluginId];

            void this.triggerUiRefresh();

            this.trackCommunityPluginDownload(pluginUpdate);

            return {
                success: true,
                installedPlugin: {
                    config: installedPluginConfig,
                    details: pluginDetails.details
                }
            };
        } catch (error) {
            this._logger.error(`Failed to update community plugin "${pluginUpdate.author}:${pluginUpdate.name}"`, error);
            return { success: false, error: "Update failed. Check the log for more info." };
        }
    }

    startCommunityPluginUpdateCheck(): void {
        void this.checkForCommunityPluginUpdates();

        if (this.updateCheckInterval == null) {
            this.updateCheckInterval = setInterval(
                async () => await this.checkForCommunityPluginUpdates(),
                24 * 60 * 60 * 1000 // Every 24 hours
            );
        }
    }

    private async checkForCommunityPluginUpdates(): Promise<void> {
        this._logger.info("Checking for community plugin updates");
        const communityPlugins = PluginConfigManager.getAllItems()
            .filter(p => p.managedPluginDetails != null)
            .map(p => ({
                id: p.id,
                details: p.managedPluginDetails
            }));

        const firebotVersionString = app.getVersion();
        const updateRequest: ManagedPluginUpdateRequest = {
            firebotVersion: parseVersion(firebotVersionString),
            plugins: communityPlugins.map(p => p.details)
        };

        try {
            const response = await fetch(`${COMMUNITY_PLUGIN_SERVICE_ROOT_URL}updates`, {
                method: "POST",
                body: JSON.stringify(updateRequest),
                headers: {
                    "User-Agent": `Firebot/${firebotVersionString}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                const responseBody = await response.text();
                this._logger.error(`Failed to check for community plugin updates. Response: ${responseBody}`);
                return;
            }

            const availableUpdates = await response.json() as ManagedPlugin[];

            for (const plugin of communityPlugins) {
                const update = availableUpdates.find(p =>
                    p.author === plugin.details.author
                    && p.name === plugin.details.name
                );

                if (update != null) {
                    this.pendingUpdates[plugin.id] = update;
                } else {
                    delete this.pendingUpdates[plugin.id];
                }
            }

            const updateCount = Object.keys(this.pendingUpdates).length;
            if (updateCount > 0) {
                this._logger.info(`Update check complete. ${updateCount} community plugin update${updateCount > 1 ? "s" : ""} available`);
            } else {
                this._logger.info("Update check complete. All community plugins up-to-date.");
            }
        } catch (error) {
            this._logger.error("Unknown error checking for community plugin updates", error);
        }

        void this.triggerUiRefresh();
    }

    // #endregion
}

const pluginManager = new PluginManager();

export { pluginManager as PluginManager };