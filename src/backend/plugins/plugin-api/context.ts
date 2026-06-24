import type { Manifest, InstalledPluginConfig } from "../../../types/plugins";
import { LoggerCache } from "../../logger-cache";
import { registerPluginLogName, unregisterPluginLogName } from "../../plugin-log-names";
import { DisposeBag, DisposeFn } from "./internal/dispose-bag";
import { normalizeName } from "./internal/name-normalizer";
import { resolvePluginDataDir } from "./internal/plugin-data-dir";

const logger = LoggerCache.getLogger("Plugins");

/**
 * The per-plugin context handed to every namespace factory.
 *
 * `manifest` is populated after the plugin is first loaded. Shim methods should read `ctx.manifest`
 * lazily (inside method bodies) instead of at factory time.
 */
export interface PluginApiContext {
    /** If a plugin, the installed config id.  */
    readonly pluginId?: string;

    /**
     * Normalized, filesystem-safe scope id for this plugin.
     */
    readonly scriptId: string;

    /** The on-disk filename of the plugin. */

    readonly fileName: string;

    /** Manifest, once known. Undefined during very-early loading. */
    readonly manifest: Manifest | undefined;

    /** Human-friendly display name. Manifest name when available, else fileName. */
    readonly displayName: string;

    /** Absolute path to this plugin's data directory. */
    readonly scriptDataDir: string;

    /** Winston child logger pre-tagged with `{ plugin: pluginId }`. */
    readonly logger: typeof logger;

    /** True when plugin is being inspected (e.g. during early detail / manifest retrieval). */
    readonly isInspecting: boolean;

    /** Register a teardown callback fired when the plugin is unloaded. */
    onDispose(fn: DisposeFn): void;
}

export interface PluginApiContextHandle {
    readonly context: PluginApiContext;
    readonly disposeBag: DisposeBag;
}

export type PluginApiContextSource =
    | { kind: "plugin", config: InstalledPluginConfig, manifest: Manifest, isInspecting: boolean };

export function createPluginApiContext(source: PluginApiContextSource): PluginApiContextHandle {
    const fileName = source.config.fileName;
    const pluginId = source.config.id;
    const scriptId = source.config.id;

    const disposeBag = new DisposeBag(`plugin:${fileName}`);
    const scriptDataDir = resolvePluginDataDir(pluginId);

    registerPluginLogName(pluginId, fileName);
    disposeBag.add(() => unregisterPluginLogName(pluginId));

    const manifest = source.manifest;

    registerPluginLogName(pluginId, manifest.name ?? fileName);

    const context: PluginApiContext = {
        scriptId,
        pluginId,
        fileName,
        manifest,
        get displayName() {
            return manifest?.name ?? fileName;
        },
        scriptDataDir,
        logger: logger.child({ module: "Plugin", plugin: pluginId }),
        isInspecting: source.isInspecting,
        onDispose: fn => disposeBag.add(fn)
    };

    return {
        context,
        disposeBag
    };
}

export { normalizeName };
