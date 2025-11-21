import { app } from "electron";
import { JsonDB } from "node-json-db";
import fs from "fs";
import path from "path";
import sanitizeFileName from "sanitize-filename";

import type { FirebotAccount } from "../../types/accounts";

import { SettingsManager } from "./settings-manager";
import * as dataAccess from "./data-access";
import frontendCommunicator from "./frontend-communicator";
import logger from "../logwrapper";

class ProfileManager {
    loggedInUser: string = null;
    profileToRename: string = null;

    constructor() {
        frontendCommunicator.on("profiles:get-active-profiles",
            () => SettingsManager.getSetting("ActiveProfiles")
        );

        frontendCommunicator.on("profiles:get-logged-in-profile",
            () => this.getLoggedInProfile()
        );

        frontendCommunicator.on("profiles:get-path-in-profile",
            (path: string) => this.getPathInProfile(path)
        );

        frontendCommunicator.on("profiles:get-account-info",
            (data: { profileId: string, accountType: string }): FirebotAccount => {
                try {
                    return dataAccess.getJsonDbInUserData(`./profiles/${data.profileId}/auth-twitch`)
                        .getData(`/${data.accountType}`) as FirebotAccount;
                } catch (error) {
                    logger.info(`Couldn't get ${data.accountType} data for profile ${data.profileId} while updating the UI. It's possible this account hasn't logged in yet.`, error);
                    return null;
                }
            }
        );

        frontendCommunicator.on("profiles:create-profile",
            (profileName: string) => this.createNewProfile(profileName)
        );

        frontendCommunicator.on("profiles:delete-profile",
            () => this.deleteProfile()
        );

        frontendCommunicator.on("profiles:switch-profile",
            (profileId: string) => this.logInProfile(profileId)
        );

        frontendCommunicator.on("profiles:rename-profile",
            (newProfileId: string) => this.renameProfile(newProfileId)
        );
    }

    private restartApp(): void {
        setTimeout(() => {
            app.relaunch({ args: process.argv.slice(1).concat(["--relaunch"]) });
            app.quit();
        }, 100);
    }

    logInProfile(profileId: string, restart = true): void {
        logger.info(`Logging in to profile "${profileId}".${restart ? " Restarting now." : ""}`);
        SettingsManager.saveSetting("LoggedInProfile", profileId);

        if (restart === true) {
            this.restartApp();
        } else {
            this.loggedInUser = SettingsManager.getSetting("LoggedInProfile");
        }
    }

    createNewProfile(profileId: string = undefined, restart = true): void {
        const globalSettingsDb = dataAccess.getJsonDbInUserData("./global-settings");
        let activeProfiles = [];

        if (profileId == null || profileId === "") {
            profileId = "Main";
        } else {
            profileId = sanitizeFileName(profileId);
        }

        // Get our active profiles
        // This means we have "Active" profiles that are being used.
        activeProfiles = SettingsManager.getSetting("ActiveProfiles");

        if (!activeProfiles?.length) {
            // This means either all profiles have been deleted, or this is our first launch.
            logger.info("No active profiles found while creating a new profile.");
        }

        let counter = 1;
        while (activeProfiles.includes(profileId)) {
            profileId = `${profileId}${counter}`;
            counter++;
        }

        // Get next profile id and push to active profiles.
        activeProfiles.push(profileId);

        // Push our new profile to settings.
        globalSettingsDb.push("/profiles/activeProfiles", activeProfiles);
        globalSettingsDb.push("/profiles/loggedInProfile", profileId);
        logger.info(`New profile created: ${profileId}.${restart ? " Restarting." : ""}`);

        // Log the new profile in and (optionally) restart app.
        this.logInProfile(profileId, restart);
    }

    getLoggedInProfile(restartIfNotLoggedIn = true): string {
    // We have a cached logged in user, return it.
        if (this.loggedInUser != null) {
            return this.loggedInUser;
        }

        // Otherwise, let's get it from the global settings file.
        this.loggedInUser = SettingsManager.getSetting("LoggedInProfile");

        // We have a value in global settings! Set it to our cache, then return.
        if (this.loggedInUser != null) {
            logger.info("Setting logged in user cache.");
            return this.loggedInUser;
        }

        // We don't have a value in our global settings. So, let's try some other things.
        logger.info(`No logged in profile in global settings file. Attempting to set one${restartIfNotLoggedIn ? " and restart the app" : ""}.`);

        const activeProfiles = SettingsManager.getSetting("ActiveProfiles");
        if (activeProfiles[0] != null) {
            this.logInProfile(activeProfiles[0], restartIfNotLoggedIn);
        } else {
            // We don't have any profiles at all. Let's make one.
            this.createNewProfile(null, restartIfNotLoggedIn);
        }

        if (restartIfNotLoggedIn !== true) {
            return this.loggedInUser;
        }
    }

    renameProfile(newProfileId: string): void {
        const profileId = this.getLoggedInProfile();
        logger.warn(`User wants to rename profile: ${profileId}. Restarting the app.`);

        let sanitizedNewProfileId = sanitizeFileName(newProfileId);
        if (sanitizedNewProfileId == null || sanitizedNewProfileId === "") {
            logger.error(`Attempted to rename profile to an invalid name: ${newProfileId}`);
            return;
        }

        // Get our active profiles
        const activeProfiles = SettingsManager.getSetting("ActiveProfiles");

        if (!activeProfiles.length) {
            logger.debug("No active profiles found");
        }

        let counter = 1;
        while (activeProfiles.includes(sanitizedNewProfileId)) {
            sanitizedNewProfileId = `${sanitizedNewProfileId}${counter}`;
            counter++;
        }

        this.profileToRename = sanitizedNewProfileId;

        // Restart the app.
        this.restartApp();
    }

    deleteProfile(): void {
        const profileId = this.getLoggedInProfile();
        logger.warn(`User wants to delete profile: ${profileId}. Restarting the app.`);

        // Lets set this profile to be deleted on restart. (When no files are in use).
        const globalSettingsDb = dataAccess.getJsonDbInUserData("./global-settings");
        globalSettingsDb.push("./profiles/deleteProfile", profileId);

        // Restart the app.
        this.restartApp();
    }

    getPathInProfile(filepath: string): string {
        return path.join(dataAccess.getUserDataPath(),
            "profiles",
            this.getLoggedInProfile(),
            filepath
        );
    }

    private getPathInProfileRelativeToUserData(filepath: string): string {
        return path.join(
            "profiles",
            this.getLoggedInProfile(),
            filepath
        );
    }

    getJsonDbInProfile(filepath: string, humanReadable = true): JsonDB {
        const jsonDbPath = this.getPathInProfile(filepath);

        try {
            const db = new JsonDB(jsonDbPath, true, humanReadable);
            db.load();
            return db;
        } catch {
            logger.error(`Error loading JsonDB at ${jsonDbPath}. Attempting to recreate.`);

            const fullPath = jsonDbPath.toLowerCase().endsWith(".json")
                ? jsonDbPath
                : `${jsonDbPath}.json`;

            fs.rmSync(fullPath, { force: true });

            return new JsonDB(jsonDbPath, true, humanReadable);
        }
    }

    profileDataPathExistsSync(filePath: string): boolean {
        const joinedPath = this.getPathInProfileRelativeToUserData(filePath);
        return dataAccess.userDataPathExistsSync(joinedPath);
    }

    deletePathInProfile(filePath: string): void {
        const joinedPath = this.getPathInProfileRelativeToUserData(filePath);
        return dataAccess.deletePathInUserData(joinedPath);
    }

    getNewProfileName = (): string => this.profileToRename;
    hasProfileRename = (): boolean => this.profileToRename != null;
}

const manager = new ProfileManager();

export { manager as ProfileManager };