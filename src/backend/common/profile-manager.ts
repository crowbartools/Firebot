import { app } from "electron";
import { JsonDB } from "node-json-db";
import fs from "fs";
import path from "path";
import sanitizeFileName from "sanitize-filename";

import { FirebotAccount } from "../../types/accounts";

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

    logInProfile(profileId: string): void {
        logger.info(`Logging in to profile "${profileId}". Restarting now.`);
        SettingsManager.saveSetting("LoggedInProfile", profileId);
        this.restartApp();
    }

    createNewProfile(profileId: string = undefined): void {
        const globalSettingsDb = dataAccess.getJsonDbInUserData("./global-settings");
        let activeProfiles = [];

        if (profileId == null || profileId === "") {
            profileId = "Main";
        } else {
            profileId = sanitizeFileName(profileId);
        }

        // Get our active profiles
        try {
            // This means we have "Active" profiles that are being used.
            activeProfiles = SettingsManager.getSetting("ActiveProfiles");
        } catch {
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
        logger.info(`New profile created: ${profileId}. Restarting.`);

        // Log the new profile in and restart app.
        this.logInProfile(profileId);
    }

    getLoggedInProfile(): string {
    // We have a cached logged in user, return it.
        if (this.loggedInUser != null) {
            return this.loggedInUser;
        }

        // Otherwise, let's get it from the global settings file.
        try {
            // We have a value in global settings! Set it to our cache, then return.
            this.loggedInUser = SettingsManager.getSetting("LoggedInProfile");
            if (this.loggedInUser != null) {
                logger.info("Setting logged in user cache.");
                return this.loggedInUser;
            }
        } catch {
            // We don't have a value in our global settings. So, lets try some other things.
            try {
                const activeProfiles = SettingsManager.getSetting("ActiveProfiles");

                logger.info("No logged in profile in global settings file. Attempting to set one and restart the app.");
                this.logInProfile(activeProfiles[0]);
            } catch {
            // We don't have any profiles at all. Let's make one.
                this.createNewProfile();
            }
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