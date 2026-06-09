import type { Manifest, InstalledPluginConfig } from "../../../types/plugins";
import { LoggerCache } from "../../logger-cache";
import { registerScriptLogName, unregisterScriptLogName } from "../../script-log-names";
import { DisposeBag, DisposeFn } from "./internal/dispose-bag";
import { normalizeName } from "./internal/name-normalizer";
import { resolveScriptDataDir } from "./internal/script-data-dir";

const logger = LoggerCache.getLogger("Plugins");

/**
 * The per-script context handed to every namespace factory.
 *
 * `manifest` is populated after the script is first loaded. Shim methods should read `ctx.manifest`
 * lazily (inside method bodies) instead of at factory time.
 */
export interface ScriptApiContext {
    /** If a plugin, the installed config id.  */
    readonly pluginId?: string;

    /**
     * Normalized, filesystem-safe scope id for this plugin/script.
     */
    readonly scriptId: string;

    /** The on-disk filename of the script. */

    readonly fileName: string;

    /** Manifest, once known. Undefined during very-early loading. */
    readonly manifest: Manifest | undefined;

    /** Human-friendly display name. Manifest name when available, else fileName. */
    readonly displayName: string;

    /** Absolute path to this script's data directory. */
    readonly scriptDataDir: string;

    /** Winston child logger pre-tagged with `{ script: scriptId }`. */
    readonly logger: typeof logger;

    /** True when script is being inspected (e.g. during early detail / manifest retrieval). */
    readonly isInspecting: boolean;

    /** Register a teardown callback fired when the plugin is unloaded. */
    onDispose(fn: DisposeFn): void;
}

export interface ScriptApiContextHandle {
    readonly context: ScriptApiContext;
    readonly disposeBag: DisposeBag;
}

export type ScriptApiContextSource =
    | { kind: "plugin", config: InstalledPluginConfig, manifest: Manifest, isInspecting: boolean }
    | { kind: "effect-script", fileName: string, manifest: Manifest, isInspecting: boolean };

export function createScriptApiContext(source: ScriptApiContextSource): ScriptApiContextHandle {
    const fileName = source.kind === "plugin" ? source.config.fileName : source.fileName;
    const pluginId = source.kind === "plugin" ? source.config.id : undefined;

    const scriptId = source.kind === "plugin"
        ? source.config.id
        : `script-${normalizeName(fileName.replace(/\.js$/i, "")) || "unknown"}`;

    const disposeBag = new DisposeBag(`script:${fileName}`);
    const scriptDataDir = resolveScriptDataDir(scriptId);

    registerScriptLogName(scriptId, fileName);
    disposeBag.add(() => unregisterScriptLogName(scriptId));

    const manifest = source.manifest;

    registerScriptLogName(scriptId, manifest.name ?? fileName);

    const context: ScriptApiContext = {
        scriptId,
        pluginId,
        fileName,
        manifest,
        get displayName() {
            return manifest?.name ?? fileName;
        },
        scriptDataDir,
        logger: logger.child({ module: "Plugin", script: scriptId }),
        isInspecting: source.isInspecting,
        onDispose: fn => disposeBag.add(fn)
    };

    return {
        context,
        disposeBag
    };
}

export { normalizeName };
