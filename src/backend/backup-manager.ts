import { app } from "electron";
import path from "path";
import fs from "fs";
import fsp from "fs/promises";
import { glob } from "glob";
import { DeflateOptions, Zip, ZipDeflate, unzipSync } from "fflate";
import logger from "./logwrapper";
import utils from "./utility";
import { SettingsManager } from "./common/settings-manager";
import dataAccess from "./common/data-access.js";
import frontendCommunicator from "./common/frontend-communicator";

const RESTORE_FOLDER_PATH = dataAccess.getPathInTmpDir("/restore");
const PROFILES_FOLDER_PATH = dataAccess.getPathInUserData("/profiles");
const USER_DATA_FOLDER_PATH = dataAccess.getPathInUserData("/");

export type FirebotBackup = {
    name: string;
    path: string;
    backupDate: Date;
    version: string;
    size: number;
    isManual: boolean;
    neverDelete: boolean;
};

class BackupManager {
    private _backupFolderPath: string = undefined;

    constructor() {
        this.updateBackupFolderPath();

        SettingsManager.on("settings:setting-updated:BackupLocation", () => {
            this.updateBackupFolderPath();
        });

        frontendCommunicator.on("backups:get-backup-folder-path", () => {
            return this._backupFolderPath;
        });

        frontendCommunicator.onAsync("backups:get-backup-list", async () => {
            return await this.getBackupList();
        });

        frontendCommunicator.on("backups:start-backup", (manualActivation: boolean) => {
            this.startBackup(manualActivation, () => {
                logger.info("backup complete");
                frontendCommunicator.send("backups:backup-complete", manualActivation);
            });
        });

        frontendCommunicator.onAsync("backups:restore-backup", async (backupFilePath: string): Promise<{ success: boolean; reason?: string; }> => {
            return await this.restoreBackup(backupFilePath);
        });

        frontendCommunicator.onAsync("backups:delete-backup", async (backupFilePath: string): Promise<boolean> => {
            try {
                await fsp.unlink(backupFilePath);
                return true;
            } catch (error) {
                logger.error("Error deleting backup", error);
                return false;
            }
        });

        frontendCommunicator.onAsync("backups:toggle-backup-prevent-deletion", async (backupFilePath: string) => {
            await this.toggleBackupPreventDeletion(backupFilePath);
        });

        frontendCommunicator.onAsync("backups:move-backup-folder", async (newPath: string) => {
            return await this.moveBackupFolder(newPath);
        });
    }

    get backupFolderPath() {
        return this._backupFolderPath;
    }

    async getBackupList(): Promise<FirebotBackup[]> {
        const files = await fsp.readdir(this._backupFolderPath);

        const backups = await Promise.all(files
            .filter(f => f.endsWith(".zip"))
            .map(async v => await this.getBackupInfo(path.join(this._backupFolderPath, v))));

        backups.sort((a, b) => {
            return b.backupDate.getTime() - a.backupDate.getTime();
        });

        return backups;
    }

    private async getBackupInfo(backupFilePath: string): Promise<FirebotBackup> {
        const fileName = path.basename(backupFilePath);
        try {
            const fileStats = await fsp.stat(backupFilePath);
            const backupDate = fileStats.birthtime;

            let version = "Unknown Version";
            const versionRegEx = /_(v?\d+\.\d+\.\d+(?:-[a-zA-Z0-9]+(?:\.\d+)?)?)(?:_|\b)/;
            const match = fileName.match(versionRegEx);
            if (match != null) {
                version = match[1];
            }

            return {
                name: fileName.replace(".zip", ""),
                path: backupFilePath,
                backupDate: backupDate,
                version: version,
                size: fileStats.size,
                isManual: fileName.includes("manual"),
                neverDelete: fileName.includes("NODELETE")
            };
        } catch (error) {
            logger.error(`Error reading backup file ${fileName}`, error);
            return undefined;
        }
    }

    private updateBackupFolderPath() {
        const backupLocation = SettingsManager.getSetting("BackupLocation");
        this._backupFolderPath = backupLocation?.length > 0
            ? backupLocation
            : path.join(dataAccess.getPathInUserData("/"), "backups");
    }

    async toggleBackupPreventDeletion(backupFilePath: string) {
        const backup = await this.getBackupInfo(backupFilePath);

        backup.neverDelete = !backup.neverDelete;
        const oldName = `${backup.name}.zip`;
        const newName = backup.neverDelete
            ? `${backup.name}_NODELETE.zip`
            : `${backup.name.replace("_NODELETE", "")}.zip`;

        await fsp.rename(
            path.join(this._backupFolderPath, oldName),
            path.join(this._backupFolderPath, newName)
        );
    }

    private async cleanUpOldBackups(callback: () => void) {
        const maxBackups = SettingsManager.getSetting("MaxBackupCount");

        if (maxBackups !== "All") {
            const fileNames = (await fsp.readdir(this._backupFolderPath))
                .map((v) => {
                    return {
                        name: v,
                        time: (fs.statSync(path.join(this._backupFolderPath, v))).birthtime.getTime()
                    };
                })
                .sort((a, b) => b.time - a.time)
                .map(v => v.name)
                .filter(n => !n.includes("NODELETE") && n.endsWith(".zip"));

            fileNames.splice(0, maxBackups);

            fileNames.forEach((f) => {
                logger.info(`Deleting old backup: ${f}`);
                fs.unlinkSync(path.join(this._backupFolderPath, f));
            });

            if (callback instanceof Function) {
                callback();
            }
        } else {
            if (callback instanceof Function) {
                callback();
            }
        }
    }

    async startBackup(manualActivation = false, callback?: () => void) {
        logger.info(`Backup manualActivation: ${manualActivation}`);

        const version = app.getVersion(),
            milliseconds = Date.now(),
            fileExtension = "zip";

        const filename = `backup_${milliseconds}_v${version}${
            manualActivation ? "_manual" : ""
        }.${fileExtension}`;

        await fsp.mkdir(this._backupFolderPath, { recursive: true });
        const output = fs.createWriteStream(path.join(this._backupFolderPath, filename));

        // listen for all archive data to be written
        output.on("close", async () => {
            SettingsManager.saveSetting("LastBackupDate", new Date());
            await this.cleanUpOldBackups(callback);
        });

        const archive = new Zip((err, data, final) => {
            if (err) {
                // throw error
                if (manualActivation) {
                    globalThis.renderWindow.webContents.send(
                        "error",
                        "Something bad happened, please check your logs."
                    );
                }
                globalThis.renderWindow.webContents.send("error", err);
                throw err;
            } else {
                output.write(data);

                if (final) {
                    output.close();
                }
            }
        });

        // Add directory to package
        const folderPath = path.resolve(dataAccess.getPathInUserData("/"));
        //archive.directory(folderPath, "profiles");

        const varIgnoreInArchive = ["backups/**", "clips/**", "logs/**", "overlay.html"];
        const ignoreResources = SettingsManager.getSetting("BackupIgnoreResources");

        if (ignoreResources && !manualActivation) {
            logger.info("Ignoring overlay-resources folder");
            varIgnoreInArchive.push("overlay-resources/**");
        }

        const fileList = await glob("**/*", {
            ignore: varIgnoreInArchive,
            cwd: folderPath,
            posix: true
        });

        const zipOptions: DeflateOptions = {
            level: 9
        };

        try {
            for (const file of fileList) {
                const fullPath = path.join(folderPath, file);

                if ((await fsp.stat(fullPath)).isFile() === true) {
                    const newFile = new ZipDeflate(file, zipOptions);

                    archive.add(newFile);

                    const fileContents = await fsp.readFile(path.join(folderPath, file));
                    newFile.push(new Uint8Array(fileContents), true);
                }
            }
        } catch (err) {
            logger.error(`Error creating backup file: ${err}`);
            throw err;
        }

        // finalize the archive (ie we are done appending files but streams have to finish yet)
        archive.end();
    }

    async onceADayBackUpCheck() {
        const shouldBackUp = SettingsManager.getSetting("BackupOnceADay"),
            lastBackupDate = SettingsManager.getSetting("LastBackupDate"),
            todayDate = new Date();

        if (shouldBackUp) {
            const isSameDay =
          lastBackupDate != null &&
          lastBackupDate.getDate() === todayDate.getDate() &&
          lastBackupDate.getMonth() === todayDate.getMonth() &&
          lastBackupDate.getFullYear() === todayDate.getFullYear();

            if (!isSameDay) {
                logger.info("Doing once a day backup");
                await this.startBackup();
            }
        }
    }

    async restoreBackup(backupFilePath: string): Promise<{ success: boolean; reason?: string; }> {
        // Validate backup zip
        try {
            const valid = await this.validateBackupZip(backupFilePath);
            if (!valid) {
                return {
                    success: false,
                    reason: "Provided zip is not a valid Firebot V5 backup."
                };
            }
        } catch (error) {
            return {
                success: false,
                reason: "Failed to validate the backup zip."
            };
        }

        // Clear out the /restore folder
        try {
            await utils.emptyFolder(RESTORE_FOLDER_PATH);
        } catch (error) {
            logger.warn("Error clearing backup restore folder", error);
        }

        // Extract the backup zip to the /restore folder
        await this.extractBackupZip(backupFilePath);

        // Clear out the profiles folder
        try {
            await utils.emptyFolder(PROFILES_FOLDER_PATH);
        } catch (error) {
            logger.warn("Error clearing profiles folder", error);
            return {
                success: false,
                reason: "Failed to clear profiles folder."
            };
        }

        try {
            await this.copyRestoreFilesToUserData();
        } catch (error) {
            logger.error("Failed to copy backup data", error);
            return {
                success: false,
                reason: "Failed to copy restore files to user data."
            };
        }

        return {
            success: true
        };
    }

    private async validateBackupZip(backupFilePath: string): Promise<boolean> {
        let hasProfilesDir = false;
        let hasGlobalSettings = false;

        const unzippedData = unzipSync(await fsp.readFile(backupFilePath));

        for (const [filepath] of Object.entries(unzippedData)) {
            if (filepath.includes("profiles")) {
                if (hasGlobalSettings) {
                    return true;
                }
                hasProfilesDir = true;
            } else if (path.basename(filepath).toLowerCase() === "global-settings.json") {
                if (hasProfilesDir) {
                    return true;
                }
                hasGlobalSettings = true;
            }
        }
        return false;
    }

    private async extractBackupZip(backupFilePath) {
        await fsp.mkdir(RESTORE_FOLDER_PATH, { recursive: true });

        const unzippedData = unzipSync(await fsp.readFile(backupFilePath));
        for (const [filepath, bytes] of Object.entries(unzippedData)) {
            if (filepath.endsWith("/")) {
                continue;
            }

            const writeFilePath = path.resolve(RESTORE_FOLDER_PATH, filepath);
            await fsp.mkdir(path.dirname(writeFilePath), { recursive: true });
            await fsp.writeFile(writeFilePath, bytes);
        }
    }

    private async copyRestoreFilesToUserData() {
        await fsp.cp(RESTORE_FOLDER_PATH, USER_DATA_FOLDER_PATH, { recursive: true, force: true });
        logger.info("Copied backup data");
    }

    private async moveBackupFolder(newPath: string): Promise<boolean> {
        let success = false;

        try {
            logger.info(`Moving backup files to ${newPath}`);

            // Test that we can access the new path
            await fsp.access(newPath);

            logger.info("Copying old backup files to new location");
            await fsp.cp(this._backupFolderPath, newPath, { force: true, recursive: true });

            logger.info("Saving new backup location setting");
            SettingsManager.saveSetting("BackupLocation", newPath);

            logger.info("Backup folder moved successfully");
            success = true;
        } catch (error) {
            logger.error(`Error moving backup folder to ${newPath}`, error);
        }

        frontendCommunicator.send("backups:move-backup-folder-completed", success);
        return success;
    }
}

const backupManager = new BackupManager();

export { backupManager as BackupManager };