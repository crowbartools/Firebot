import { BasicViewer, FirebotViewer } from "../../types/viewers";
import logger from "../logwrapper";

import { SettingsManager } from "../common/settings-manager";
import viewerDatabase from "./viewer-database";
import chatRolesManager from "../roles/chat-roles-manager";
import connectionManager from "../common/connection-manager";
import eventManager from "../events/EventManager";
import twitchChat from "../chat/twitch-chat";
import frontendCommunicator from "../common/frontend-communicator";

class ViewerOnlineStatusManager {
    private _updateLastSeenIntervalId: NodeJS.Timeout;
    private _updateTimeIntervalId: NodeJS.Timeout;

    constructor() {
        viewerDatabase.on("viewer-database-loaded", async () => {
            await this.setAllViewersOffline();

            // update online viewer's lastSeen prop every minute
            this._updateLastSeenIntervalId = setInterval(async () => await this.setLastSeenDateTime(), 60000);

            // Update online viewer minutes every 15 minutes.
            this._updateTimeIntervalId = setInterval(async () => await this.calcAllViewersOnlineMinutes(), 900000);
        });

        frontendCommunicator.onAsync("disconnect-viewer-db", async () => {
            await this.setAllViewersOffline();

            // Clear the online time calc interval.
            clearInterval(this._updateTimeIntervalId);
            clearInterval(this._updateLastSeenIntervalId);

            viewerDatabase.disconnectViewerDatabase();

            logger.debug("Disconnecting from viewer database.");
        });
    }

    async getOnlineViewers(): Promise<FirebotViewer[]> {
        try {
            return await viewerDatabase.getViewerDb().findAsync({ online: true });
        } catch (error) {
            return [];
        }
    }

    async getViewerOnlineMinutes(username: string): Promise<number> {
        if (viewerDatabase.isViewerDBOn() !== true) {
            return;
        }
        const viewer = await viewerDatabase.getViewerByUsername(username);
        return viewer.online
            ? viewer.minutesInChannel + (Date.now() - viewer.onlineAt) / 60000
            : viewer.minutesInChannel;
    }

    async getTopViewTimeViewers(count: number): Promise<FirebotViewer[]> {
        if (viewerDatabase.isViewerDBOn() !== true) {
            return [];
        }

        const sortObj = {
            minutesInChannel: -1
        };

        const projectionObj = {
            username: 1,
            minutesInChannel: 1
        };

        try {
            const viewers = await viewerDatabase.getViewerDb()
                .findAsync({})
                .sort(sortObj)
                .limit(count)
                .projection(projectionObj);

            return viewers || [];
        } catch (error) {
            logger.error("Error getting top view time viewers: ", error);
            return [];
        }
    }

    async setChatViewerOnline(viewer: BasicViewer): Promise<void> {
        if (viewerDatabase.isViewerDBOn() !== true) {
            return;
        }

        try {
            const now = Date.now();
            const dbData: Partial<FirebotViewer> = {
                username: viewer.username,
                displayName: viewer.displayName,
                twitchRoles: viewer.twitchRoles,
                online: true,
                onlineAt: now,
                lastSeen: now
            };
            if (viewer.profilePicUrl != null) {
                dbData.profilePicUrl = viewer.profilePicUrl;
            }

            if (await chatRolesManager.userIsKnownBot(viewer.id) === true && SettingsManager.getSetting("AutoFlagBots")) {
                dbData.disableAutoStatAccrual = true;
                dbData.disableActiveUserList = true;
            }

            await viewerDatabase.getViewerDb().updateAsync({ _id: viewer.id }, { $set: dbData });

            await viewerDatabase.calculateAutoRanks(viewer.id);

        } catch (error) {
            logger.error("Failed to set viewer to online", error);
        }
    }

    async setAllChatViewersOnline(): Promise<void> {
        await twitchChat.populateChatterList();
        const viewers = await twitchChat.getViewerList();

        if (viewers == null) {
            return;
        }

        for (const viewer of viewers) {
            // Here we convert the viewer list viewer object to one that matches
            // what we get from chat messages...
            const viewerPacket: BasicViewer = {
                id: viewer.id,
                username: viewer.username,
                displayName: viewer.displayName,
                twitchRoles: viewer.twitchRoles
            };

            this.setChatViewerOnline(viewerPacket);
        }
    }

    async setChatViewerOffline(id: string): Promise<void> {
        if (viewerDatabase.isViewerDBOn() !== true) {
            return;
        }

        try {
        // Find the viewer by id to get their minutes viewed.
        // Update their minutes viewed with our new times.
            const viewer = await viewerDatabase.getViewerById(id);

            if (viewer == null) {
                return;
            }

            await viewerDatabase.getViewerDb().updateAsync({ _id: viewer._id }, { $set: { online: false } });

            logger.debug(`ViewerDB: Set ${viewer.username} (${viewer._id}) to offline.`);
        } catch (error) {
            logger.error("ViewerDB: Error setting viewer to offline.", error);
        }
    }

    async setAllViewersOffline(): Promise<void> {
        if (viewerDatabase.isViewerDBOn() !== true || viewerDatabase.getViewerDb() == null) {
            return;
        }

        logger.debug('ViewerDB: Trying to set all viewers to offline.');

        const { numAffected } = await viewerDatabase.getViewerDb().updateAsync({online: true}, {$set: { online: false }}, { multi: true });

        if (numAffected > 0) {
            logger.debug(`ViewerDB: Set ${numAffected} viewers to offline.`);
        } else {
            logger.debug('ViewerDB: No viewers were set to offline.');
        }
    }

    /**
     * Update viewers with last seen time. Allows us to recover chat hours from crash.
     */
    async setLastSeenDateTime(): Promise<void> {
        if (viewerDatabase.isViewerDBOn() !== true) {
            return;
        }

        try {
            const { numAffected } = await viewerDatabase.getViewerDb().updateAsync({ online: true }, { $set: { lastSeen: Date.now() } }, { multi: true });

            logger.debug(`ViewerDB: Setting last seen date for ${numAffected} viewers`);
        } catch (error) {
            logger.debug("ViewerDB: Error setting last seen");
        }
    }

    async calcViewerOnlineMinutes(viewer: FirebotViewer): Promise<void> {
        if (viewerDatabase.isViewerDBOn() !== true || !viewer.online || viewer.disableAutoStatAccrual) {
            return;
        }

        const now = Date.now();

        // viewer.lastSeen is updated every minute by "setLastSeenDateTime".
        // If viewer.lastSeen was over a minute ago, we use viewer.lastSeen, otherwise we just use the current time.
        const lastSeen = (viewer.lastSeen && (now - viewer.lastSeen) > 60000) ? viewer.lastSeen : now;

        // Calculate the minutes to add to the viewer's total
        // Since this method is on a 15 min interval, we don't want to add anymore than 15 new minutes.
        const additionalMinutes = Math.min(Math.round((lastSeen - viewer.onlineAt) / 60000), 15);

        // No new minutes to add; return early to avoid hit to DB
        if (additionalMinutes < 1) {
            return Promise.resolve();
        }

        // Calculate viewers new minutes total.
        const previousTotalMinutes = viewer.minutesInChannel;
        const newTotalMinutes = previousTotalMinutes + additionalMinutes;

        try {
            const { numAffected } = await viewerDatabase.getViewerDb()
                .updateAsync({ _id: viewer._id }, { $set: { minutesInChannel: newTotalMinutes } });

            if (numAffected === 0) {
                logger.debug(`ViewerDB: Couldnt update viewer's online minutes. viewerId: ${viewer._id}`);
            } else {
                this.viewerViewTimeUpdate(viewer, previousTotalMinutes, newTotalMinutes);
            }
        } catch (error) {
            logger.debug(`ViewerDB: Couldnt update viewer's online minutes because of an error. viewerId: ${viewer._id}`, error);
        }
    }

    async calcAllViewersOnlineMinutes(): Promise<void> {
        try {
            if (connectionManager.streamerIsOnline() === true) {
                const onlineViewers = await viewerDatabase.getViewerDb().findAsync({ online: true });

                onlineViewers.forEach(viewer => this.calcViewerOnlineMinutes(viewer));
            }
        } catch (error) { }
    }

    /**
     * Triggers a View Time Update event if view time hours has increased
     */
    viewerViewTimeUpdate(viewer: FirebotViewer, previousTotalMinutes: number, newTotalMinutes: number): void {
        if (viewer == null) {
            return;
        }
        const previousHours = previousTotalMinutes > 0 ? Math.trunc(previousTotalMinutes / 60) : 0;
        const newHours = newTotalMinutes > 0 ? Math.trunc(newTotalMinutes / 60) : 0;
        if (newHours < 1) {
            return;
        }
        if (newHours !== previousHours) {

            eventManager.triggerEvent("firebot", "view-time-update", {
                username: viewer.username,
                previousViewTime: previousHours,
                newViewTime: newHours
            });

            viewerDatabase.calculateAutoRanks(viewer._id, "view_time");
        }
    }
}

const viewerOnlineStatusManager = new ViewerOnlineStatusManager();

twitchChat.on("connected", () => {
    viewerOnlineStatusManager.setAllChatViewersOnline();
});

twitchChat.on("disconnected", () => {
    viewerOnlineStatusManager.setAllViewersOffline();
});

export = viewerOnlineStatusManager;