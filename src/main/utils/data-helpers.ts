import { app } from "electron";
import path from "path";
import fs from "fs";

/**
 * This is the path to folder the app is currently living in.
 * IE: C:\Users\<user>\AppData\Local\Firebot\app-6.0.0\
 * This will change after every update.
 */
export const workingDirectoryPath = process.cwd();

/**
 * This is the path to the user data folder.
 * IE: C:\Users\<user>\AppData\Roaming\firebot\
 * This stays the same after every update.
 */
export const userDataPath = app.getPath("userData");

/**
 * This is the path to the v6's data folder.
 * IE: C:\Users\<user>\AppData\Roaming\firebot\v6
 */
export const firebotDataPath = path.join(userDataPath, "v6");

export const tempDataPath = path.join(userDataPath, "temp");

export function getPathInFirebotData(filePath: string) {
    return path.join(firebotDataPath, filePath);
}

export async function pathExists(filePath: string): Promise<boolean> {
    try {
        await fs.promises.access(filePath);
        return true;
    } catch (error) {
        return false;
    }
}

function pathExistsSync(filePath: string) {
    try {
        fs.accessSync(filePath);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Only use this sync version during app start up. Otherwise please use
 * the async version.
 */
export function ensureFirebotDataDirExistsSync(relativePath = "") {
    const fullPath = path.join(firebotDataPath, relativePath);
    if (!pathExistsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
}

export async function ensureFirebotDataDirExists(relativePath = "") {
    const fullPath = path.join(firebotDataPath, relativePath);
    if (!(await pathExists(fullPath))) {
        await fs.promises.mkdir(fullPath, { recursive: true });
    }
}
