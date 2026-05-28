import path from "path";
import { promises as fsp } from "fs";

import type { ScriptFsApi, ScriptFsDirEntry } from "../../../../types/script-api";
import { defineScriptApiNamespace } from "../internal/define-namespace";

function isEnoent(error: unknown): boolean {
    return (
        typeof error === "object"
        && error !== null
        && (error as NodeJS.ErrnoException).code === "ENOENT"
    );
}

/**
 * Sandboxed filesystem API. Every operation is rooted at the script's data
 * directory. Relative paths that try to escape via `..`, absolute paths,
 * or anything that resolves outside the sandbox are rejected.
 */
export const createFsApi = defineScriptApiNamespace<ScriptFsApi>((ctx) => {
    const root = path.resolve(ctx.scriptDataDir);

    /** Resolve a sandboxed path or throw if it escapes. */
    function resolveSandboxed(relativePath: string): string {
        if (typeof relativePath !== "string") {
            throw new Error(`Expected a string path, got ${typeof relativePath}`);
        }
        if (path.isAbsolute(relativePath)) {
            throw new Error(`Absolute paths are not allowed: "${relativePath}"`);
        }

        const resolved = path.resolve(root, relativePath);
        const rel = path.relative(root, resolved);
        if (rel.startsWith("..") || path.isAbsolute(rel)) {
            throw new Error(
                `Path "${relativePath}" escapes the script data directory.`
            );
        }
        return resolved;
    }

    async function ensureRoot(): Promise<void> {
        await fsp.mkdir(root, { recursive: true });
    }

    async function ensureParent(absPath: string): Promise<void> {
        await fsp.mkdir(path.dirname(absPath), { recursive: true });
    }

    return {
        get dataDir() {
            return root;
        },

        resolve(relativePath) {
            return resolveSandboxed(relativePath);
        },

        async exists(relativePath) {
            try {
                await fsp.access(resolveSandboxed(relativePath));
                return true;
            } catch {
                return false;
            }
        },

        async readText(relativePath, encoding = "utf8") {
            return fsp.readFile(resolveSandboxed(relativePath), { encoding });
        },

        async writeText(relativePath, contents, encoding = "utf8") {
            const abs = resolveSandboxed(relativePath);
            await ensureParent(abs);
            await fsp.writeFile(abs, contents, { encoding });
        },

        async readBytes(relativePath) {
            return fsp.readFile(resolveSandboxed(relativePath));
        },

        async writeBytes(relativePath, contents) {
            const abs = resolveSandboxed(relativePath);
            await ensureParent(abs);
            await fsp.writeFile(abs, contents);
        },

        async readJson(relativePath) {
            const abs = resolveSandboxed(relativePath);
            try {
                const raw = await fsp.readFile(abs, "utf8");
                return JSON.parse(raw) as unknown;
            } catch (error) {
                if (isEnoent(error)) {
                    return null;
                }
                throw error;
            }
        },

        async writeJson(relativePath, value) {
            const abs = resolveSandboxed(relativePath);
            await ensureParent(abs);
            await fsp.writeFile(abs, JSON.stringify(value, null, 2), "utf8");
        },

        async mkdir(relativePath) {
            await fsp.mkdir(resolveSandboxed(relativePath), { recursive: true });
        },

        async remove(relativePath) {
            const abs = resolveSandboxed(relativePath);
            await fsp.rm(abs, { recursive: true, force: true });
        },

        async list(relativePath = ".") {
            const abs = resolveSandboxed(relativePath);
            await ensureRoot();
            try {
                const entries = await fsp.readdir(abs, { withFileTypes: true });
                return entries.map((entry): ScriptFsDirEntry => {
                    const rel = path.relative(root, path.join(abs, entry.name));
                    return {
                        name: entry.name,
                        relativePath: rel.split(path.sep).join("/"),
                        isFile: entry.isFile(),
                        isDirectory: entry.isDirectory()
                    };
                });
            } catch (error) {
                if (isEnoent(error)) {
                    return [];
                }
                throw error;
            }
        }
    };
});
