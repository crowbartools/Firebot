import { TypedEmitter } from "tiny-typed-emitter";
import Datastore from "@seald-io/nedb";
import { DateTime } from "luxon";
import type { HelixUser, HelixBan } from "@twurple/api";

import type { BasicViewer, FirebotViewer, NewFirebotViewer } from "../../types/viewers";
import type { Rank, RankLadder } from "../../types/ranks";

import { AccountAccess } from "../common/account-access";
import { BackupManager } from "../backup-manager";
import { EventManager } from "../events/event-manager";
import { ProfileManager } from "../common/profile-manager";
import { SettingsManager } from "../common/settings-manager";
import { TwitchApi } from "../streaming-platforms/twitch/api";
import chatRolesManager from "../roles/chat-roles-manager";
import currencyAccess from "../currency/currency-access";
import rankManager from "../ranks/rank-manager";
import roleHelpers from "../roles/role-helpers";
import teamRolesManager from "../roles/team-roles-manager";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";
import { commafy, wait } from "../utils";

interface ViewerDbChangePacket {
    userId: string;
    field: string;
    value: unknown;
}

interface UpdateViewerRankPacket {
    userId: string;
    rankLadderId: string;
    rankId: string;
}

interface ViewerPurgeOptions {
    daysSinceActive: {
        enabled: boolean;
        value?: number;
    };
    viewTimeHours: {
        enabled: boolean;
        value?: number;
    };
    chatMessagesSent: {
        enabled: boolean;
        value?: number;
    };
    banned: {
        enabled: boolean;
    };
}

interface UserDetails {
    firebotData: FirebotViewer;
    twitchData: Record<string, unknown>;
    streamerFollowsUser: boolean;
    userFollowsStreamer: boolean;
}

class ViewerDatabase extends TypedEmitter<{
    "viewer-database-loaded": () => void;
    "updated-viewer-avatar": (event: { userId: string, url: string }) => void;
}> {
    private _db: Datastore<FirebotViewer>;
    private _dbCompactionInterval = 30000;

    private cancelRankRecalculation = false;
    private _activeViewers: string[] = [];

    constructor() {
        super();

        frontendCommunicator.onAsync("connect-viewer-db", async () => {
            if (this.isViewerDBOn() !== true) {
                return;
            }
            await this.connectViewerDatabase();
            logger.debug("Connecting to viewer database.");
        });

        frontendCommunicator.onAsync("viewer-db-change", async (data: ViewerDbChangePacket) => {
            if (this.isViewerDBOn() !== true) {
                return;
            }

            await this.updateDbCell(data);
        });

        frontendCommunicator.onAsync("get-purge-preview", async (options: ViewerPurgeOptions) => {
            if (this.isViewerDBOn() !== true) {
                return Promise.resolve([]);
            }
            return await this.getPurgeViewers(options);
        });

        frontendCommunicator.onAsync("purge-viewers", async (options: ViewerPurgeOptions) => {
            if (this.isViewerDBOn() !== true) {
                return 0;
            }
            return await this.purgeViewers(options);
        });

        frontendCommunicator.onAsync("viewer-database:get-all-viewers", async () => {
            if (this.isViewerDBOn() !== true) {
                return [];
            }
            return await this.getAllViewers();
        });

        frontendCommunicator.onAsync("create-firebot-viewer-data", async (viewer: BasicViewer) => {
            return this.createNewViewer({
                id: viewer.id, 
                username: viewer.username, 
                displayName: viewer.displayName, 
                profilePicUrl: viewer.profilePicUrl, 
                twitchRoles: viewer.twitchRoles
            });
        });

        frontendCommunicator.onAsync("get-firebot-viewer-data", async (userId: string) => {
            await this.calculateAutoRanks(userId);
            return await this.getViewerById(userId);
        });

        frontendCommunicator.onAsync("remove-viewer-from-db", async (userId: string) => {
            await this.removeViewer(userId);
        });

        frontendCommunicator.onAsync("get-viewer-details", async (userId: string) => {
            return await this.getUserDetails(userId);
        });

        frontendCommunicator.onAsync("update-firebot-viewer-data-field", async (data: ViewerDbChangePacket) => {
            const { userId, field, value } = data;
            await this.updateViewerDataField(userId, field, value);
        });

        frontendCommunicator.onAsync("update-viewer-rank", async (data: UpdateViewerRankPacket) => {
            const { userId, rankLadderId, rankId } = data;
            await this.setViewerRankById(userId, rankLadderId, rankId);
        });

        frontendCommunicator.onAsync("get-viewer-count", async () => {
            return await this._db.countAsync({});
        });

        frontendCommunicator.onAsync("rank-recalculation:start", async (rankLadderId: string) => {
            this.cancelRankRecalculation = false;
            await this.recalculateRanksForAllViewers(rankLadderId);
        });

        frontendCommunicator.on("rank-recalculation:cancel", () => {
            this.cancelRankRecalculation = true;
        });
    }

    /**
     * Checks settings to see if viewer database is enabled.
     * @returns `true` if the viewer database is enabled, or `false` otherwise
     */
    isViewerDBOn(): boolean {
        return SettingsManager.getSetting("ViewerDB");
    }

    async connectViewerDatabase(): Promise<void> {
        logger.info('ViewerDB: Trying to connect to viewer database...');
        if (this.isViewerDBOn() !== true) {
            return;
        }

        const path = ProfileManager.getPathInProfile("db/users.db");
        this._db = new Datastore({ filename: path });
        try {
            await this._db.loadDatabaseAsync();
        } catch (error) {
            logger.info("ViewerDB: Error Loading Database: ", (error as Error).message);
            logger.info("ViewerDB: Failed Database Path: ", path);
        }

        // Setup our automatic compaction interval to shrink filesize.
        this._db.setAutocompactionInterval(this._dbCompactionInterval);
        setInterval(() => {
            logger.debug(`ViewerDB: Compaction should be happening now. Compaction Interval: ${this._dbCompactionInterval}`);
        }, this._dbCompactionInterval);

        logger.info("ViewerDB: Viewer Database Loaded: ", path);
        this.emit("viewer-database-loaded");
    }

    disconnectViewerDatabase(): void {
        this._db = null;
    }

    getViewerDb(): Datastore<FirebotViewer> {
        return this._db;
    }

    async createNewViewer(viewer: NewFirebotViewer): Promise<FirebotViewer> {
        if (this.isViewerDBOn() !== true) {
            return;
        }

        const streamerUserId = AccountAccess.getAccounts().streamer.userId;
        const botUserId = AccountAccess.getAccounts().bot.userId;

        const disableAutoStatAccrual = viewer.id === streamerUserId || viewer.id === botUserId;

        let viewerToCreate: FirebotViewer = {
            username: viewer.username,
            _id: viewer.id,
            displayName: viewer.displayName,
            profilePicUrl: viewer.profilePicUrl,
            twitch: true,
            twitchRoles: viewer.twitchRoles || [],
            online: viewer.online,
            onlineAt: Date.now(),
            lastSeen: Date.now(),
            joinDate: Date.now(),
            minutesInChannel: viewer.minutesInChannel || 0,
            chatMessages: 0,
            disableAutoStatAccrual: disableAutoStatAccrual,
            disableActiveUserList: false,
            disableViewerList: false,
            metadata: {},
            currency: {},
            ranks: {}
        };

        // THIS IS WHERE YOU ADD IN ANY DYNAMIC FIELDS THAT ALL VIEWERS SHOULD HAVE.
        // Add in all of our currencies and set them to 0.
        viewerToCreate = currencyAccess.addCurrencyToNewViewer(viewerToCreate);

        // Insert our record into db.
        try {
            const newViewer = await this._db.insertAsync(viewerToCreate);

            void EventManager.triggerEvent("firebot", "viewer-created", {
                username: viewer.username,
                userId: viewer.id,
                userDisplayName: viewer.displayName
            });

            frontendCommunicator.send("viewer-database:viewer-created", newViewer as FirebotViewer);

            return newViewer;
        } catch (error) {
            logger.error("ViewerDB: Error adding viewer", error);
        }
    }

    async addNewViewerFromChat(viewerDetails: BasicViewer, isOnline = true) {
        return await this.createNewViewer({
            id: viewerDetails.id,
            username: viewerDetails.username,
            displayName: viewerDetails.displayName,
            profilePicUrl: viewerDetails.profilePicUrl,
            twitchRoles: viewerDetails.twitchRoles,
            online: isOnline
        });
    }

    async getViewerById(id: string): Promise<FirebotViewer> {
        if (this.isViewerDBOn() !== true) {
            return;
        }

        try {
            return await this._db.findOneAsync({ _id: id });
        } catch (error) {
            logger.error("Error getting viewer by ID", error);
        }
    }

    async getViewerByUsername(username: string): Promise<FirebotViewer> {
        if (this.isViewerDBOn() !== true) {
            return;
        }

        try {
            const searchTerm = new RegExp(`^${username}$`, 'i');

            return await this._db.findOneAsync({ username: { $regex: searchTerm }, twitch: true });
        } catch {
            return;
        }
    }

    async getAllViewers(): Promise<FirebotViewer[]> {
        if (this.isViewerDBOn() !== true) {
            return [];
        }

        return Object.values(await this._db.findAsync({}));
    }

    async getAllUsernames(): Promise<string[]> {
        if (this.isViewerDBOn() !== true) {
            return [];
        }

        const projectionObj = {
            displayName: 1
        };

        try {
            const viewers = await this._db.findAsync({ twitch: true })
                .projection(projectionObj);

            return viewers?.map(u => u.displayName) ?? [];
        } catch (error) {
            logger.error("Error getting all viewers: ", error);
            return [];
        }
    }

    async getAllUsernamesWithIds(): Promise<{ id: string, username: string, displayName: string }[]> {
        if (this.isViewerDBOn() !== true) {
            return [];
        }

        const projectionObj = {
            displayName: 1,
            username: 1
        };

        try {
            const viewers = await this._db.findAsync({ twitch: true })
                .projection(projectionObj);

            return viewers?.map(u => ({ id: u._id, username: u.username, displayName: u.displayName })) ?? [];
        } catch (error) {
            logger.error("Error getting all viewers: ", error);
            return [];
        }
    }

    async incrementDbField(userId: string, fieldName: string): Promise<void> {
        if (this.isViewerDBOn() !== true) {
            return;
        }

        try {
            const updateDoc = {};
            updateDoc[fieldName] = 1;

            const { affectedDocuments } = await this._db.updateAsync({ _id: userId, disableAutoStatAccrual: { $ne: true } }, { $inc: updateDoc }, { returnUpdatedDocs: true });

            if (affectedDocuments) {
                const updateObj = {};
                updateObj[fieldName] = commafy(affectedDocuments[fieldName] as number);

                frontendCommunicator.send("viewer-database:viewer-updated", affectedDocuments as FirebotViewer);
            }
        } catch (error) {
            logger.error("incrementDbField error", error);
        }
    }

    private sanitizeDbInput(changePacket: ViewerDbChangePacket): ViewerDbChangePacket {
        if (this.isViewerDBOn() !== true) {
            return;
        }
        switch (changePacket.field) {
            case "lastSeen":
            case "joinDate":
                changePacket.value = DateTime.fromJSDate(changePacket.value as Date).toMillis();
                break;
            case "minutesInChannel":
            case "chatMessages":
                changePacket.value = parseInt(changePacket.value as string);
                break;
            default:
        }

        return changePacket;
    }

    async updateDbCell(changePacket: ViewerDbChangePacket): Promise<void> {
        if (this.isViewerDBOn() !== true) {
            return;
        }

        const sanitiedChangePacket = this.sanitizeDbInput(changePacket);
        const id = sanitiedChangePacket.userId,
            field = sanitiedChangePacket.field,
            newValue = sanitiedChangePacket.value;

        const updateDoc = {};
        updateDoc[field] = newValue;

        try {
            const { affectedDocuments } = await this._db.updateAsync({ _id: id }, { $set: updateDoc }, { returnUpdatedDocs: true });

            if (affectedDocuments) {
                frontendCommunicator.send("viewer-database:viewer-updated", affectedDocuments as FirebotViewer);
            }
        } catch (error) {
            logger.error("Error adding currency to viewer.", error);
        }
    }

    async updateViewer(viewer: FirebotViewer): Promise<boolean> {
        if (viewer == null) {
            return false;
        }

        try {
            const { affectedDocuments } = await this._db.updateAsync({ _id: viewer._id }, viewer, { returnUpdatedDocs: true });

            if (affectedDocuments) {
                frontendCommunicator.send("viewer-database:viewer-updated", affectedDocuments as FirebotViewer);
            }

            return true;
        } catch (error) {
            logger.warn("Failed to update viewer in DB", error);
            return false;
        }
    }

    async updateViewerDataField(userId: string, field: string, value: unknown): Promise<void> {
        const updateObject = {};
        updateObject[field] = value;

        try {
            const { affectedDocuments } = await this._db.updateAsync({ _id: userId }, { $set: updateObject }, { returnUpdatedDocs: true });

            if (affectedDocuments) {
                frontendCommunicator.send("viewer-database:viewer-updated", affectedDocuments as FirebotViewer);
            }
        } catch (error) {
            logger.error("Error updating viewer.", error);
        }
    }

    async removeViewer(userId: string): Promise<boolean> {
        if (userId == null) {
            return false;
        }

        try {
            await this._db.removeAsync({ _id: userId }, { });

            frontendCommunicator.send("viewer-database:viewer-deleted", userId);

            return true;
        } catch (error) {
            logger.warn("Failed to remove viewer from DB", error);
            return false;
        }
    }

    private getPurgeWherePredicate(options: ViewerPurgeOptions, bannedUsers: HelixBan[]): () => boolean {
        return function () {
            const viewer = this as FirebotViewer;

            if (!viewer.twitch) {
                return false;
            }

            let daysInactive = 0;
            if (options.daysSinceActive.enabled) {
                daysInactive = DateTime.utc().diff(DateTime.fromMillis(viewer.lastSeen), "days").days;
            }
            const viewTimeHours = viewer.minutesInChannel / 60;

            if ((
                options.daysSinceActive.enabled ||
                options.viewTimeHours.enabled ||
                options.chatMessagesSent.enabled ||
                options.banned.enabled
            ) &&
            (!options.daysSinceActive.enabled || daysInactive > options.daysSinceActive.value) &&
            (!options.viewTimeHours.enabled || viewTimeHours < options.viewTimeHours.value) &&
            (!options.chatMessagesSent.enabled || viewer.chatMessages < options.chatMessagesSent.value) &&
            (!options.banned.enabled || bannedUsers.some(u => u.userId === viewer._id))) {
                return true;
            }
            return false;
        };
    }

    async getPurgeViewers(options: ViewerPurgeOptions): Promise<FirebotViewer[]> {
        try {
            const bannedUsers = (await TwitchApi.moderation.getBannedUsers()).filter(u => u.expiryDate === null);
            return await this._db.findAsync({ $where: this.getPurgeWherePredicate(options, bannedUsers) });
        } catch {
            return [];
        }
    }

    async purgeViewers(options: ViewerPurgeOptions): Promise<number> {
        await BackupManager.startBackup(false);

        try {
            const bannedUsers = (await TwitchApi.moderation.getBannedUsers()).filter(u => u.expiryDate === null);
            const numRemoved = await this._db
                .removeAsync({ $where: this.getPurgeWherePredicate(options, bannedUsers) }, { multi: true });

            frontendCommunicator.send("viewer-database:viewers-updated");

            return numRemoved;
        } catch {
            return 0;
        }
    }

    async setViewerRank(viewer: FirebotViewer, ladderId: string, newRankId?: string): Promise<void> {
        if (this.isViewerDBOn() !== true) {
            return;
        }

        const ladder = rankManager.getRankLadderHelper(ladderId);
        if (!ladder) {
            return;
        }

        if (viewer.ranks == null) {
            viewer.ranks = {};
        }

        const currentRankId = viewer.ranks[ladderId];
        if (currentRankId === newRankId) {
            return;
        }

        viewer.ranks[ladderId] = newRankId;

        await this.updateViewer(viewer);

        const isPromotion = ladder.isRankHigher(newRankId, currentRankId);

        if (isPromotion && ladder.announcePromotionsInChat && this._activeViewers.includes(viewer._id)) {
            const newRank = ladder.getRank(newRankId);
            const rankValueDescription = ladder.getRankValueDescription(newRankId);

            const promotionMessageTemplate = ladder.promotionMessageTemplate;
            const promotionMessage = promotionMessageTemplate
                .replace(/{user}/g, viewer.displayName)
                .replace(/{rank}/g, newRank?.name)
                .replace(/{rankDescription}/g, rankValueDescription);
            await TwitchApi.chat.sendChatMessage(promotionMessage, null, true);
        }

        const newRank = ladder.getRank(newRankId);
        const previousRank = ladder.getRank(currentRankId);

        void EventManager.triggerEvent("firebot", "viewer-rank-updated", {
            username: viewer.username,
            userId: viewer._id,
            userDisplayName: viewer.displayName,
            rankLadderName: ladder.name,
            rankLadderId: ladderId,
            newRankName: newRank?.name,
            newRankId: newRank?.id,
            previousRankName: previousRank?.name,
            previousRankId: previousRank?.id,
            isPromotion: isPromotion,
            isDemotion: !isPromotion
        });
    }

    async setViewerRankById(userId: string, ladderId: string, rankId: string): Promise<void> {
        if (this.isViewerDBOn() !== true) {
            return;
        }

        const viewer = await this.getViewerById(userId);

        if (viewer == null) {
            return;
        }

        await this.setViewerRank(viewer, ladderId, rankId);
    }

    viewerHasRank(viewer: FirebotViewer, ladderId: string, rankId: string): boolean {
        if (this.isViewerDBOn() !== true) {
            return false;
        }

        if (!viewer) {
            return false;
        }

        const ladder = rankManager.getRankLadderHelper(ladderId);

        if (ladder == null) {
            return false;
        }

        if (!ladder.hasRank(rankId)) {
            return false;
        }

        const viewersCurrentRankId = viewer.ranks?.[ladderId] ?? null;

        return rankId === viewersCurrentRankId;
    }

    async viewerHasRankById(userId: string, ladderId: string, rankId: string): Promise<boolean> {
        if (this.isViewerDBOn() !== true) {
            return false;
        }

        const viewer = await this.getViewerById(userId);

        return this.viewerHasRank(viewer, ladderId, rankId);
    }

    async getViewerRankForLadderByUserName(userName: string, ladderId: string): Promise<Rank | null> {
        if (this.isViewerDBOn() !== true) {
            return null;
        }

        const viewer = await this.getViewerByUsername(userName);

        if (viewer == null) {
            return null;
        }

        return await this.getViewerRankForLadder(viewer._id, ladderId);
    }


    async getViewerRankForLadder(userId: string, ladderId: string): Promise<Rank | null> {
        if (this.isViewerDBOn() !== true) {
            return null;
        }

        await this.calculateAutoRanks(userId);

        const viewer = await this.getViewerById(userId);

        const ladder = rankManager.getRankLadderHelper(ladderId);

        if (ladder == null) {
            return null;
        }

        const viewersCurrentRankId = viewer.ranks?.[ladderId] ?? null;

        return ladder.getRank(viewersCurrentRankId);
    }

    async calculateAutoRanks(userId: string, trackByType?: RankLadder["settings"]["trackBy"]): Promise<void> {
        if (this.isViewerDBOn() !== true) {
            return;
        }

        const applicableLadders = rankManager.getRankLadderHelpers()
            .filter(ladder => ladder.mode === "auto" && (trackByType == null || ladder.trackBy === trackByType));

        if (applicableLadders.length === 0) {
            return;
        }

        const viewer = await this.getViewerById(userId);

        if (viewer == null) {
            return;
        }

        if (viewer.ranks == null) {
            viewer.ranks = {};
        }

        for (const ladder of applicableLadders) {

            const currentRankId = viewer.ranks[ladder.id];

            if (ladder.restrictedToRoleIds.length > 0) {
                const userRoles = await roleHelpers.getAllRolesForViewer(userId);
                if (!userRoles.some(r => ladder.restrictedToRoleIds.includes(r.id))) {
                    if (currentRankId != null) {
                        await this.setViewerRank(viewer, ladder.id, undefined);
                    }
                    continue;
                }
            }

            const highestQualifiedRankId = ladder.getHighestQualifiedRankId(viewer);

            if (currentRankId !== highestQualifiedRankId) {
                await this.setViewerRank(viewer, ladder.id, highestQualifiedRankId);
            }
        }
    }

    async calculateAutoRanksByName(userName: string, trackByType?: RankLadder["settings"]["trackBy"]): Promise<void> {
        if (this.isViewerDBOn() !== true) {
            return;
        }

        const viewer = await this.getViewerByUsername(userName);

        if (viewer == null) {
            return;
        }

        await this.calculateAutoRanks(viewer._id, trackByType);
    }

    async recalculateRanksForAllViewers(rankLadderId: string): Promise<void> {
        const ladder = rankManager.getRankLadderHelper(rankLadderId);

        if (this.isViewerDBOn() !== true || ladder == null) {
            frontendCommunicator.send("rank-recalculation:complete");
            return;
        }

        await wait(1000);

        const viewers = await this.getAllViewers();

        let processedViewers = 0;
        for (const viewer of viewers) {
            if (this.cancelRankRecalculation) {
                this.cancelRankRecalculation = false;
                return;
            }

            if (viewer.ranks == null) {
                viewer.ranks = {};
            }

            const currentRankId = viewer.ranks[ladder.id];
            const highestQualifiedRankId = ladder.getHighestQualifiedRankId(viewer);

            try {
                if (currentRankId !== highestQualifiedRankId) {
                    await this.setViewerRank(viewer, ladder.id, highestQualifiedRankId);
                }

                processedViewers += 1;

                if (processedViewers % 5 === 0) {
                    frontendCommunicator.send("rank-recalculation:progress", processedViewers);
                    await wait(5);
                }
            } catch (error) {
                logger.error("Error recalculating ranks for viewer", viewer._id, error);
            }
        }

        frontendCommunicator.send("rank-recalculation:progress", processedViewers);

        await this._db.compactDatafileAsync();

        await wait(1000);

        frontendCommunicator.send("rank-recalculation:complete");
    }

    addActiveViewer(userId: string) {
        if (!this._activeViewers.includes(userId)) {
            this._activeViewers.push(userId);
        }
    }

    removeActiveViewer(userId: string) {
        this._activeViewers = this._activeViewers.filter(v => v !== userId);
    }

    async getUserDetails(userId: string): Promise<Partial<UserDetails>> {
        await this.calculateAutoRanks(userId);

        const firebotUserData = await this.getViewerById(userId);

        if (firebotUserData != null && !firebotUserData.twitch) {
            return {
                firebotData: (firebotUserData ?? {}) as FirebotViewer
            };
        }

        let twitchUser: HelixUser;
        try {
            twitchUser = await TwitchApi.users.getUserById(userId);
        } catch {
            // fail silently for now
        }

        if (twitchUser == null) {
            return {
                firebotData: (firebotUserData ?? {}) as FirebotViewer
            };
        }

        const twitchUserData: Record<string, unknown> = {
            id: twitchUser.id,
            username: twitchUser.name,
            displayName: twitchUser.displayName,
            profilePicUrl: twitchUser.profilePictureUrl,
            creationDate: twitchUser.creationDate
        };

        const userRoles = await chatRolesManager.getUsersChatRoles(twitchUser.id);

        if (firebotUserData) {
            let userUpdated = false;

            if (firebotUserData.username !== twitchUser.name
                || firebotUserData.displayName !== twitchUser.displayName
            ) {
                firebotUserData.username = twitchUser.name;
                firebotUserData.displayName = twitchUser.displayName;
                userUpdated = true;
            }

            if (firebotUserData.profilePicUrl !== twitchUser.profilePictureUrl) {
                this.emit("updated-viewer-avatar", { userId: twitchUser.id, url: twitchUser.profilePictureUrl });

                firebotUserData.profilePicUrl = twitchUser.profilePictureUrl;
                userUpdated = true;
            }

            if (userUpdated) {
                await this.updateViewer(firebotUserData);

                frontendCommunicator.send("twitch:chat:user-updated", {
                    id: firebotUserData._id,
                    username: firebotUserData.username,
                    displayName: firebotUserData.displayName,
                    roles: userRoles,
                    profilePicUrl: firebotUserData.profilePicUrl,
                    active: this._activeViewers.includes(firebotUserData._id)
                });
            }
        }

        const streamerData = AccountAccess.getAccounts().streamer;

        const client = TwitchApi.streamerClient;

        let isBanned: boolean;
        try {
            isBanned = await client.moderation.checkUserBan(streamerData.userId, twitchUser.id);
        } catch (error) {
            logger.warn("Unable to get banned status", error);
        }

        const teamRoles = await teamRolesManager.getAllTeamRolesForViewer(twitchUser.name);

        const userFollowsStreamerResponse = await client.channels.getChannelFollowers(
            streamerData.userId,
            userId
        );

        const streamerFollowsUserResponse = await client.channels.getFollowedChannels(
            streamerData.userId,
            userId
        );

        const streamerFollowsUser = streamerFollowsUserResponse.data != null &&
            streamerFollowsUserResponse.data.length === 1;
        const userFollowsStreamer = userFollowsStreamerResponse.data != null &&
            userFollowsStreamerResponse.data.length === 1;

        if (twitchUserData) {
            twitchUserData.followDate = userFollowsStreamer &&
                userFollowsStreamerResponse.data[0].followDate;
            twitchUserData.isBanned = isBanned;
            twitchUserData.userRoles = userRoles || [];
            twitchUserData.teamRoles = teamRoles || [];
        }

        const userDetails: UserDetails = {
            firebotData: (firebotUserData ?? {}) as FirebotViewer,
            twitchData: twitchUserData,
            streamerFollowsUser: streamerFollowsUser,
            userFollowsStreamer: userFollowsStreamer
        };

        return userDetails;
    }
}

const viewerDatabase = new ViewerDatabase();

export = viewerDatabase;