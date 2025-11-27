import { app } from "electron";
import path from "path";
import fs from "fs";
import fsp from "fs/promises";
import { JsonDB } from "node-json-db";

import argv from "./argv-parser";
import frontendCommunicator from "./frontend-communicator";
import logger from "../logwrapper";

const isDev = !app.isPackaged;

// This is the path to folder the app is currently living in. IE: C:\Users\<user>\AppData\Local\Firebot\app-4.0.0\
// This will change after every update.
const workingDirectoryRoot = process.platform === "darwin" ? process.resourcesPath : path.dirname(process.execPath);
const workingDirectoryPath = isDev ? path.join(app.getAppPath(), "build") : workingDirectoryRoot;

export function getWorkingDirectoryPath(): string {
    return workingDirectoryPath;
};

// Renderer process has to get `app` module via `d`, whereas the main process can get it directly
// app.getPath("userData") will return a string of the user's app data directory path.
// This is the path to the user data folder. IE: C:\Users\<user>\AppData\Roaming\Firebot\
// This stays the same after every update.
const appDataPath = app.getPath("appData");

let userDataPath: string, tmpDirectoryPath: string;
if (Object.hasOwn(argv, "fbuser-data-directory") && argv["fbuser-data-directory"] != null && argv["fbuser-data-directory"] !== "") {
    userDataPath = argv["fbuser-data-directory"] as string;
    tmpDirectoryPath = path.join(userDataPath, "./tmp");
} else {
    const rootUserDataPath = path.join(appDataPath, "Firebot");
    userDataPath = path.join(rootUserDataPath, "v5");
    tmpDirectoryPath = path.join(rootUserDataPath, "tmp");
}

export function getPathInUserData(filePath: string): string {
    return path.join(userDataPath, filePath);
};

export function getPathInWorkingDir(filePath: string): string {
    return path.join(workingDirectoryPath, filePath);
};

export function getPathInTmpDir(filePath: string): string {
    return path.join(tmpDirectoryPath, filePath);
};

export function deletePathInTmpDir(filePath: string): void {
    fs.unlinkSync(path.join(tmpDirectoryPath, filePath));
};

export function deletePathInUserData(filePath: string): void {
    fs.unlinkSync(path.join(userDataPath, filePath));
};

export function deleteFolderRecursive(pathname: string): void {
    if (fs.existsSync(pathname)) {
        fs.readdirSync(pathname).forEach(function (file) {
            const curPath = path.join(pathname, file);
            if (fs.statSync(curPath).isDirectory()) {
                // recurse
                deleteFolderRecursive(curPath);
            } else {
                // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(pathname);
    }
};

export function getUserDataPath(): string {
    return userDataPath;
};

function pathExists(path: string): Promise<boolean> {
    return new Promise((resolve) => {
        fs.access(path, (err) => {
            if (err) {
                //ENOENT means Error NO ENTity found, aka the file/folder doesn't exist.
                if (err.code === "ENOENT") {
                    // This folder doesn't exist. Resolve and create it.
                    resolve(false);
                } else {
                    // Some weird error happened other than the path missing.
                    logger.error(err);
                }
            } else {
                resolve(true);
            }
        });
    });
}

export async function createFirebotDataDir(): Promise<void> {
    if (!await pathExists(userDataPath)) {
        logger.info("Creating firebot-data folder...");
        fs.mkdirSync(userDataPath);
    }
};

export function getJsonDbInUserData(filePath: string): JsonDB {
    const jsonDbPath = path.join(userDataPath, filePath);
    return new JsonDB(jsonDbPath, true, true);
};

export async function makeDirInUserData(filePath: string): Promise<void> {
    const joinedPath = path.join(userDataPath, filePath);
    await fsp.mkdir(joinedPath);
};

export function makeDirInUserDataSync(filePath: string): boolean {
    try {
        const joinedPath = path.join(userDataPath, filePath);
        fs.mkdirSync(joinedPath);
        return true;
    } catch (err) {
        logger.error(`Error creating ${filePath}: ${err}`);
        return false;
    }
};

export function writeFileInWorkingDir(
    filePath: string,
    data: string,
    callback: fs.NoParamCallback
): void {
    const joinedPath = path.join(workingDirectoryPath, filePath);
    fs.writeFile(joinedPath, data, { encoding: "utf8" }, callback);
};

export function writeFileInUserData(
    filePath: string,
    data: string,
    callback: fs.NoParamCallback
): void {
    const joinedPath = path.join(userDataPath, filePath);
    fs.writeFile(joinedPath, data, { encoding: "utf8" }, callback);
};

export function copyDefaultConfigToUserData(
    configFileName: string,
    userDataDestination: string
): void {
    const source = getPathInWorkingDir(
        `/resources/default-configs/${configFileName}`
    );
    const destination = getPathInUserData(
        `${userDataDestination}/${configFileName}`
    );
    fs.writeFileSync(destination, fs.readFileSync(source));
};

export function copyResourceToUserData(
    resourcePath = "",
    resourceName: string,
    userDataDestination = ""
): void {
    try {
        const source = getPathInWorkingDir(
            resourcePath == null || resourcePath === ""
                ? path.join("resources", resourceName)
                : path.join("resources", resourcePath, resourceName)
        );

        const destination = getPathInUserData(
            path.join(userDataDestination, resourceName)
        );
        fs.writeFileSync(destination, fs.readFileSync(source));
    } catch (error) {
        logger.error(`Failed to copy resource ${resourceName}`, error);
    }
};

export async function workingDirPathExists(filePath: string): Promise<unknown> {
    const joinedPath = path.join(workingDirectoryPath, filePath);
    return pathExists(joinedPath);
};

export async function userDataPathExists(filePath: string): Promise<boolean> {
    const joinedPath = path.join(userDataPath, filePath);
    return pathExists(joinedPath);
};

function pathExistsSync(path: string): boolean {
    return fs.existsSync(path);
}

export function userDataPathExistsSync(filePath: string): boolean {
    const joinedPath = path.join(userDataPath, filePath);
    return pathExistsSync(joinedPath);
};

frontendCommunicator.on("data-access:get-path-in-user-data",
    (path: string) => getPathInUserData(path)
);

export { tmpDirectoryPath as getTmpDirectory };