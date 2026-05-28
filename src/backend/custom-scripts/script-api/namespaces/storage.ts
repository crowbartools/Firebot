import path from "path";
import { promises as fsp } from "fs";

import type { ScriptStorageApi } from "../../../../types/script-api";
import { defineScriptApiNamespace } from "../internal/define-namespace";

function isEnoent(error: unknown): boolean {
    return (
        typeof error === "object"
        && error !== null
        && (error as NodeJS.ErrnoException).code === "ENOENT"
    );
}

/**
 * Simple per-script storage. Lets a script easily save/load JSON values or
 * arbitrary files inside its own data directory.
 */
export const createStorageApi = defineScriptApiNamespace<ScriptStorageApi>((ctx) => {
    const root = path.resolve(ctx.scriptDataDir);

    function resolveInRoot(name: string): string {
        if (typeof name !== "string" || name.length === 0) {
            throw new Error("Expected a non-empty string");
        }
        if (path.isAbsolute(name)) {
            throw new Error(`Absolute paths are not allowed: "${name}"`);
        }

        const resolved = path.resolve(root, name);
        const rel = path.relative(root, resolved);
        if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) {
            throw new Error(`Path "${name}" escapes the script data directory.`);
        }
        return resolved;
    }

    function resolveJsonKey(key: string): string {
        if (typeof key !== "string" || key.length === 0) {
            throw new Error("Expected a non-empty JSON key");
        }
        if (/[\\/]/.test(key) || key.includes("..")) {
            throw new Error(`Invalid JSON key: "${key}"`);
        }
        return resolveInRoot(`${key}.json`);
    }

    async function ensureParent(absPath: string): Promise<void> {
        await fsp.mkdir(path.dirname(absPath), { recursive: true });
    }

    return {
        get path() {
            return root;
        },

        async getJson<T = unknown>(key: string): Promise<T | null> {
            const abs = resolveJsonKey(key);
            try {
                const raw = await fsp.readFile(abs, "utf8");
                return JSON.parse(raw) as T;
            } catch (error) {
                if (isEnoent(error)) {
                    return null;
                }
                throw error;
            }
        },

        async setJson(key, value) {
            const abs = resolveJsonKey(key);
            await ensureParent(abs);
            await fsp.writeFile(abs, JSON.stringify(value, null, 2), "utf8");
        },

        async deleteJson(key) {
            const abs = resolveJsonKey(key);
            await fsp.rm(abs, { force: true });
        },

        async fileExists(name) {
            try {
                await fsp.access(resolveInRoot(name));
                return true;
            } catch {
                return false;
            }
        },

        async readFile(name) {
            const abs = resolveInRoot(name);
            try {
                return await fsp.readFile(abs);
            } catch (error) {
                if (isEnoent(error)) {
                    return null;
                }
                throw error;
            }
        },

        async readTextFile(name, encoding = "utf8") {
            const abs = resolveInRoot(name);
            try {
                return await fsp.readFile(abs, { encoding });
            } catch (error) {
                if (isEnoent(error)) {
                    return null;
                }
                throw error;
            }
        },

        async writeFile(name, contents) {
            const abs = resolveInRoot(name);
            await ensureParent(abs);
            await fsp.writeFile(abs, contents);
        },

        async deleteFile(name) {
            const abs = resolveInRoot(name);
            await fsp.rm(abs, { force: true });
        }
    };
});
