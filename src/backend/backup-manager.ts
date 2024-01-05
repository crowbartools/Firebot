import { app } from "electron";
import path from "path";
import fs from "fs";
import fsp from "fs/promises";
import { glob } from "glob";
import { DeflateOptions, Zip, ZipDeflate } from "fflate";
import { settings } from "./common/settings-access";
import dataAccess from "./common/data-access.js";
import logger from "./logwrapper";

class BackupManager {
    private readonly _backupFolderPath = path.join(dataAccess.getPathInUserData("/"), "backups");

    private async cleanUpOldBackups(callback: () => void) {
        const maxBackups = settings.maxBackupCount();

        if (maxBackups !== "All") {
            const fileNames = (await fsp.readdir(this._backupFolderPath))
                .map((v) => {
                    return {
                        name: v,
                        time: (fs.statSync(path.join(this._backupFolderPath, v))).birthtime.getTime()
                    };
                })
                .sort((a, b) => b.time - a.time)
                .map((v) => v.name)
                .filter(n => !n.includes("NODELETE") && n.endsWith(".zip"));

            fileNames.splice(0, maxBackups);

            fileNames.forEach(f => {
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
            settings.setLastBackupDate(new Date());
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

        const varIgnoreInArchive = ['backups/**', 'clips/**', 'logs/**', 'overlay.html'];
        const ignoreResources = settings.backupIgnoreResources();

        if (ignoreResources && !manualActivation) {
            logger.info("Ignoring overlay-resources folder");
            varIgnoreInArchive.push('overlay-resources/**');
        }

        const fileList = await glob("**/*", {
            ignore: varIgnoreInArchive,
            cwd: folderPath
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
        const shouldBackUp = settings.backupOnceADay(),
            lastBackupDate = settings.lastBackupDate(),
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
}

const backupManager = new BackupManager();

export = backupManager;