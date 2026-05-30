import type { Manifest, InstalledPluginConfig } from "../../../types/plugins";
import logger from "../../logwrapper";
import { registerScriptLogName, unregisterScriptLogName } from "../../script-log-names";
import { DisposeBag, DisposeFn } from "./internal/dispose-bag";
import { normalizeName } from "./internal/name-normalizer";
import { resolveScriptDataDir } from "./internal/script-data-dir";

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

    /** Register a teardown callback fired when the plugin is unloaded. */
    onDispose(fn: DisposeFn): void;
}

export interface ScriptApiContextHandle {
    readonly context: ScriptApiContext;
    readonly disposeBag: DisposeBag;
    setManifest(manifest: Manifest | undefined): void;
}

export type ScriptApiContextSource =
    | { kind: "plugin", config: InstalledPluginConfig }
    | { kind: "effect-script", fileName: string };

export function createScriptApiContext(source: ScriptApiContextSource): ScriptApiContextHandle {
    const fileName = source.kind === "plugin" ? source.config.fileName : source.fileName;
    const pluginId = source.kind === "plugin" ? source.config.id : undefined;

    const scriptId = source.kind === "plugin"
        ? source.config.id
        : `script-${normalizeName(fileName.replace(/\.js$/i, "")) || "unknown"}`;

    const disposeBag = new DisposeBag(`script:${fileName}`);
    const scriptDataDir = resolveScriptDataDir(scriptId);
    let manifest: Manifest | undefined;

    registerScriptLogName(scriptId, fileName);
    disposeBag.add(() => unregisterScriptLogName(scriptId));

    const context: ScriptApiContext = {
        pluginId,
        fileName,
        get manifest() {
            return manifest;
        },
        scriptId,
        get displayName() {
            return manifest?.name ?? fileName;
        },
        scriptDataDir,
        logger: logger.child({ script: scriptId }),
        onDispose: fn => disposeBag.add(fn)
    };

    return {
        context,
        disposeBag,
        setManifest(next) {
            manifest = next;
            registerScriptLogName(scriptId, next?.name ?? fileName);
        }
    };
}

export { normalizeName };
