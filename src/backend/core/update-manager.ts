import { app, autoUpdater, shell } from "electron";
import { Octokit, type RestEndpointMethodTypes } from "@octokit/rest";

import { FirebotAutoUpdateLevel } from "../../types";

import { BackupManager } from "../backup-manager";
import { SettingsManager } from "../common/settings-manager";
import { compareVersions, UpdateType } from "../../shared/compare-versions";
import frontendCommunicator from "../common/frontend-communicator";
import { LoggerCache } from "../logger-cache";

const UPDATE_FEED_URL = `https://update.electronjs.org/crowbartools/Firebot/win32/${app.getVersion()}`;
const FIREBOT_RELEASES_REPO_OWNER = "crowbartools";
const FIREBOT_RELEASES_REPO_NAME = "Firebot";

type UpdateData = {
    updateIsAvailable: boolean;
    willAutoUpdate: boolean;
    newBetaAvailable: boolean;
    newMajorUpdateAvailable: boolean;
    name?: string;
    version?: string;
    url?: string;
    releaseDate?: string;
    releaseNotes?: string;
    latestUpdateType?: UpdateType;
};

class UpdateManager {
    private _logger = LoggerCache.getLogger("Updates");
    private _octokit = new Octokit();

    private _isCheckingForUpdates = false;
    private _hasCheckedForUpdates = false;
    private _updateDownloaded = false;
    private _updateData: UpdateData = {
        updateIsAvailable: false,
        willAutoUpdate: false,
        newBetaAvailable: false,
        newMajorUpdateAvailable: false
    };

    constructor() {
        frontendCommunicator.onAsync("updates:ui-service-ready",
            async () => await this.checkForUpdate()
        );

        frontendCommunicator.on("updates:install-update",
            () => this.installUpdate()
        );

        frontendCommunicator.onAsync("updates:download-and-install-update",
            async () => {
                if (this._updateData?.updateIsAvailable === true
                    && this._updateData?.latestUpdateType === UpdateType.PRERELEASE
                ) {
                    await shell.openExternal(`https://github.com/crowbartools/Firebot/releases/${this._updateData.version}`);
                } else {
                    await this.downloadUpdate();
                    this.installUpdate();
                }
            }
        );
    }

    private shouldAutoUpdate(updateType: UpdateType): boolean {
        const autoUpdateLevel = SettingsManager.getSetting("AutoUpdateLevel");

        // if auto updating is completely disabled
        if (autoUpdateLevel === FirebotAutoUpdateLevel.Off) {
            return false;
        }

        // Skip auto update if this is dev build or is not running on Windows
        if (!app.isPackaged || process.platform !== "win32") {
            return false;
        }

        // check each update type
        switch (updateType) {
            case UpdateType.OFFICIAL:
            case UpdateType.PATCH:
            case UpdateType.MINOR:
                return (autoUpdateLevel as number) >= 1;
            case UpdateType.PRERELEASE:
            case UpdateType.NONE:
            case UpdateType.MAJOR:
            case UpdateType.MAJOR_PRERELEASE:
            default:
                return false;
        }
    }

    private async checkForUpdate(): Promise<void> {
        if (this._isCheckingForUpdates === true) {
            this._logger.info("Already checking for Firebot update");
            return;
        }

        if (this._hasCheckedForUpdates === true) {
            this._logger.info("Update check has already run");
            return;
        }

        this._isCheckingForUpdates = true;

        this._logger.info("Checking for Firebot update");

        try {
            const releases = (await this._octokit.repos.listReleases({
                owner: FIREBOT_RELEASES_REPO_OWNER,
                repo: FIREBOT_RELEASES_REPO_NAME
            })).data;

            let latestRelease: RestEndpointMethodTypes["repos"]["listReleases"]["response"]["data"][0] = null;
            let latestUpdateType: UpdateType = null;
            let foundMajorRelease = false;

            for (const release of releases) {
                // Now lets look to see if there is a newer version.
                const updateType = compareVersions(release.tag_name, app.getVersion());

                if (!foundMajorRelease && (updateType === UpdateType.MAJOR || updateType === UpdateType.MAJOR_PRERELEASE)) {
                    foundMajorRelease = true;
                    this._logger.debug(`Found new major version: ${release.tag_name}`);
                    if (SettingsManager.getSetting("NotifyOnBeta")) {
                        this._updateData.newBetaAvailable = true;
                        this._updateData.newMajorUpdateAvailable = true;
                        this._updateData.name = release.name;
                        this._updateData.version = release.tag_name;
                        this._updateData.url = release.html_url;
                        this._updateData.latestUpdateType = updateType;
                    }
                } else if (updateType === UpdateType.OFFICIAL
                    || updateType === UpdateType.PATCH
                    || updateType === UpdateType.MINOR
                    || updateType === UpdateType.NONE
                    || (updateType === UpdateType.PRERELEASE && SettingsManager.getSetting("NotifyOnBeta"))
                ) {
                    this._logger.debug(`Latest available version: ${release.tag_name}`);
                    latestRelease = release;
                    latestUpdateType = updateType;
                    if (updateType === UpdateType.PRERELEASE) {
                        this._updateData.newBetaAvailable = true;
                    }
                    break;
                }
            }

            if (latestRelease != null) {
                // Now lets look to see if there is a newer version.
                let updateIsAvailable = false;
                if (latestUpdateType !== UpdateType.NONE) {
                    updateIsAvailable = true;
                }

                this._updateData = {
                    ...this._updateData,
                    name: latestRelease.name,
                    version: latestRelease.tag_name,
                    url: latestRelease.html_url,
                    releaseDate: latestRelease.published_at,
                    releaseNotes: latestRelease.body,
                    updateIsAvailable,
                    latestUpdateType
                };

                if (updateIsAvailable) {
                    // Check if we should auto update based on the users setting
                    if (this.shouldAutoUpdate(latestUpdateType)) {
                        this._updateData.willAutoUpdate = true;
                        void this.downloadUpdate();
                    }
                }
            }
        } catch (error) {
            this._logger.error("Failed to check for updates", error);
        }

        this._hasCheckedForUpdates = true;
        this._isCheckingForUpdates = false;

        this.triggerUiRefresh();
    }

    private async downloadUpdate(): Promise<void> {
        if (process.platform !== "win32") {
            this._logger.warn("Cannot automatically download Firebot updates on this platform");
        } else if (this._updateDownloaded === true) {
            this._logger.info("Update already downloaded");
        } else if (this._updateData.updateIsAvailable === true) {
            this._logger.info(`Downloading Firebot ${this._updateData.version}`);

            frontendCommunicator.send("updates:show-download-modal");

            //back up first
            if (SettingsManager.getSetting("BackupBeforeUpdates")) {
                await BackupManager.startBackup();
            }

            autoUpdater.setFeedURL({ url: UPDATE_FEED_URL });
            autoUpdater.checkForUpdates();

            // When an update has been downloaded
            autoUpdater.on("update-downloaded", () => {
                this._logger.info(`Firebot ${this._updateData.version} downloaded`);

                this._updateDownloaded = true;

                //let the front end know and wait a few secs.
                frontendCommunicator.send("updates:update-downloaded");

                // Prepare for update install on next run
                SettingsManager.saveSetting("JustUpdated", true);
            });
        } else {
            this._logger.info("No update to download");
        }
    }

    private installUpdate(): void {
        if (process.platform !== "win32") {
            this._logger.warn("Cannot automatically install Firebot updates on this platform");
        } else if (this._updateDownloaded !== true) {
            this._logger.warn("No downloaded update to install");
        } else if (this._updateData.updateIsAvailable === true) {
            this._logger.info(`Installing Firebot ${this._updateData.version}`);

            frontendCommunicator.send("updates:show-download-modal");
            frontendCommunicator.send("updates:installing-update");

            autoUpdater.quitAndInstall();
        } else {
            this._logger.info("No update to install");
        }
    }

    triggerUiRefresh(): void {
        this._logger.debug("Triggering UI refresh");
        frontendCommunicator.send("updates:update-data", app.isPackaged ? this._updateData : null);
    }
}

const manager = new UpdateManager();

export { manager as UpdateManager };