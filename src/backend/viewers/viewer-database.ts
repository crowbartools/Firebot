import { EventEmitter } from "events";
import Datastore from "@seald-io/nedb";
import { DateTime } from "luxon";

import { BasicViewer, FirebotViewer } from "../../types/viewers";
import { SettingsManager } from "../common/settings-manager";
import logger from "../logwrapper";
import profileManager from "../common/profile-manager";
import accountAccess from "../common/account-access";
import userAccess from "../common/user-access";
import currencyAccess from "../currency/currency-access";
import eventManager from "../events/EventManager";
import { BackupManager } from "../backup-manager";
import frontendCommunicator from "../common/frontend-communicator";
import rankManager from "../ranks/rank-manager";
import util, { wait } from "../utility";
import { Rank, RankLadder } from "../../types/ranks";

import { userIsActive } from "../chat/chat-listeners/active-user-handler";
import roleHelpers from "../roles/role-helpers";

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
}

class ViewerDatabase extends EventEmitter {
    private _db: Datastore<FirebotViewer>;
    private _dbCompactionInterval = 30000;

    private cancelRankRecalculation = false;

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

        frontendCommunicator.onAsync("get-all-viewers", async () => {
            if (this.isViewerDBOn() !== true) {
                return [];
            }
            return await this.getAllViewers();
        });

        frontendCommunicator.onAsync("create-firebot-viewer-data", async (viewer: BasicViewer) => {
            return this.createNewViewer(viewer.id, viewer.username, viewer.displayName, viewer.profilePicUrl, viewer.twitchRoles);
        });

        frontendCommunicator.onAsync("get-firebot-viewer-data", async (userId: string) => {
            await this.calculateAutoRanks(userId);
            return await this.getViewerById(userId);
        });

        frontendCommunicator.onAsync("remove-viewer-from-db", async (userId: string) => {
            await this.removeViewer(userId);
        });

        frontendCommunicator.onAsync("get-viewer-details", async (userId: string) => {
            return await userAccess.getUserDetails(userId);
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

        frontendCommunicator.onAsync("rank-recalculation:cancel", async () => {
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

        const path = profileManager.getPathInProfile("db/users.db");
        this._db = new Datastore({ filename: path });
        try {
            await this._db.loadDatabaseAsync();
        } catch (error) {
            logger.info("ViewerDB: Error Loading Database: ", error.message);
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

    async createNewViewer(
        userId: string,
        username: string,
        displayName: string,
        profilePicUrl?: string,
        twitchRoles?: string[],
        isOnline = false
    ): Promise<FirebotViewer> {
        if (this.isViewerDBOn() !== true) {
            return;
        }

        const streamerUserId = accountAccess.getAccounts().streamer.userId;
        const botUserId = accountAccess.getAccounts().bot.userId;

        const disableAutoStatAccrual = userId === streamerUserId || userId === botUserId;

        let viewer: FirebotViewer = {
            username: username,
            _id: userId,
            displayName: displayName,
            profilePicUrl: profilePicUrl,
            twitch: true,
            twitchRoles: twitchRoles || [],
            online: isOnline,
            onlineAt: Date.now(),
            lastSeen: Date.now(),
            joinDate: Date.now(),
            minutesInChannel: 0,
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
        viewer = currencyAccess.addCurrencyToNewViewer(viewer);

        // Insert our record into db.
        try {
            eventManager.triggerEvent("firebot", "viewer-created", {
                username,
                userId,
                userDisplayName: displayName
            });

            const newViewer = await this._db.insertAsync(viewer);

            return newViewer;
        } catch (error) {
            logger.error("ViewerDB: Error adding viewer", error);
        }
    }

    async addNewViewerFromChat(viewerDetails: BasicViewer, isOnline = true) {
        return await this.createNewViewer(
            viewerDetails.id,
            viewerDetails.username,
            viewerDetails.displayName,
            viewerDetails.profilePicUrl,
            viewerDetails.twitchRoles,
            isOnline
        );
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
        } catch (error) {
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

    async getAllUsernamesWithIds(): Promise<{ id: string; username: string; displayName: string; }[]> {
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

            if (affectedDocuments != null) {
                const updateObj = {};
                updateObj[fieldName] = util.commafy(affectedDocuments[fieldName]);
            }
        } catch (error) {
            logger.error(error);
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
            await this._db.updateAsync({ _id: id }, { $set: updateDoc });
        } catch (error) {
            logger.error("Error adding currency to viewer.", error);
        }
    }

    async updateViewer(viewer: FirebotViewer): Promise<boolean> {
        if (viewer == null) {
            return false;
        }

        try {
            await this._db.updateAsync({ _id: viewer._id }, viewer);
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
            await this._db.updateAsync({ _id: userId }, { $set: updateObject }, { returnUpdatedDocs: true });
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
            return true;
        } catch (error) {
            logger.warn("Failed to remove viewer from DB", error);
            return false;
        }
    }

    private getPurgeWherePredicate(options: ViewerPurgeOptions): () => boolean {
        return function () {
            const viewer: FirebotViewer = this;

            if (!viewer.twitch) {
                return false;
            }

            let daysInactive = 0;
            if (options.daysSinceActive.enabled) {
                daysInactive = DateTime.utc().diff(DateTime.fromMillis(viewer.lastSeen), "days").days;
            }
            const viewTimeHours = viewer.minutesInChannel / 60;

            if ((options.daysSinceActive.enabled || options.viewTimeHours.enabled || options.chatMessagesSent.enabled) &&
            (!options.daysSinceActive.enabled || daysInactive > options.daysSinceActive.value) &&
            (!options.viewTimeHours.enabled || viewTimeHours < options.viewTimeHours.value) &&
            (!options.chatMessagesSent.enabled || viewer.chatMessages < options.chatMessagesSent.value)) {
                return true;
            }
            return false;
        };
    }

    async getPurgeViewers(options: ViewerPurgeOptions): Promise<FirebotViewer[]> {
        try {
            return await this._db.findAsync({ $where: this.getPurgeWherePredicate(options)});
        } catch (error) {
            return [];
        }
    }

    async purgeViewers(options: ViewerPurgeOptions): Promise<number> {
        await BackupManager.startBackup(false);

        try {
            const numRemoved = await this._db
                .removeAsync({ $where: this.getPurgeWherePredicate(options)}, {multi: true});

            return numRemoved;
        } catch (error) {
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

        if (isPromotion && ladder.announcePromotionsInChat && userIsActive(viewer._id)) {
            const newRank = ladder.getRank(newRankId);
            const rankValueDescription = ladder.getRankValueDescription(newRankId);

            const promotionMessageTemplate = ladder.promotionMessageTemplate;
            const promotionMessage = promotionMessageTemplate
                .replace(/{user}/g, viewer.displayName)
                .replace(/{rank}/g, newRank?.name)
                .replace(/{rankDescription}/g, rankValueDescription);
            const twitchChat = require("../chat/twitch-chat");
            await twitchChat.sendChatMessage(promotionMessage);
        }

        const newRank = ladder.getRank(newRankId);
        const previousRank = ladder.getRank(currentRankId);

        eventManager.triggerEvent("firebot", "viewer-rank-updated", {
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

    async viewerHasRank(viewer: FirebotViewer, ladderId: string, rankId: string): Promise<boolean> {
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
}

const viewerDatabase = new ViewerDatabase();

export = viewerDatabase;