import { DateTime, Duration } from "luxon";

import { FirebotViewer } from "../../types/viewers";

import logger from "../logwrapper";
import util from "../utility";
import currencyAccess, { Currency } from "./currency-access";
import viewerDatabase from "../viewers/viewer-database";
import viewerOnlineStatusManager from "../viewers/viewer-online-status-manager";
import eventManager from "../events/EventManager";
import frontendCommunicator from "../common/frontend-communicator";
import connectionManager from "../common/connection-manager";
import twitchChat from "../chat/twitch-chat";
import customRolesManager from "../roles/custom-roles-manager";
import firebotRolesManager from "../roles/firebot-roles-manager";
import teamRolesManager from "../roles/team-roles-manager";
import twitchRolesManager from "../../shared/twitch-roles";

interface GiveCurrencyRequest {
    currencyId: string;
    targetType: "allOnline" | "allOnlineInRole" | "individual";
    username?: string;
    sendChatMessage: boolean;
    amount: number;
    role?: string;
}

class CurrencyManager {
    private _currencyInterval: NodeJS.Timeout;

    constructor() {
        currencyAccess.on("currencies:currency-created", async (currency: Currency) => {
            if (currencyAccess.isViewerDBOn() !== true) {
                return;
            }
            logger.info(`Creating a new currency with id ${currency.id}`);
            await this.addCurrencyToAllViewers(currency.id, 0);
        });

        currencyAccess.on("currencies:currency-deleted", async (currency: Currency) => {
            if (currencyAccess.isViewerDBOn() !== true) {
                return;
            }
            logger.info(`Deleting currency with id ${currency.id}`);
            await this.deleteCurrencyById(currency.id);
        });

        frontendCommunicator.onAsync("give-currency", async ({
            currencyId,
            amount,
            sendChatMessage,
            targetType,
            username,
            role
        }: GiveCurrencyRequest) => {
            const currency = currencyAccess.getCurrencyById(currencyId);
            if (currency == null) {
                logger.error("Couldn't find currency to give or remove");
                return;
            }

            let messageTarget = "";
            switch (targetType) {
                case "allOnline":
                    await this.addCurrencyToOnlineViewers(currencyId, amount);
                    messageTarget = `everyone`;
                    break;
                case "allOnlineInRole":
                    this.addCurrencyToViewerGroupOnlineViewers([role], currencyId, amount);
                    messageTarget = `all viewers in role ${role}`;
                    break;
                case "individual":
                    await this.adjustCurrencyForViewer(username, currencyId, amount);
                    messageTarget = `@${username}`;
                    break;
            }

            if (sendChatMessage && messageTarget !== "") {
                const twitchChat = require("../chat/twitch-chat");
                if (!twitchChat.chatIsConnected) {
                    return;
                }

                await twitchChat.sendChatMessage(`${amount < 0 ? "Removed" : "Gave"} ${util.commafy(amount)} ${currency.name} ${amount < 0 ? "from" : "to"} ${messageTarget}!`);
            }
        });

        // Purge Currency Event
        // This gets a message from front end when a currency needs to be purged.
        frontendCommunicator.onAsync("currencies:purge-currency", async (currencyId: string) => {
            if (currencyAccess.isViewerDBOn() !== true) {
                return;
            }
            logger.info(`Purging currency with id ${currencyId}`);
            await this.purgeCurrencyById(currencyId);
        });
    }

    /**
     * Adjust Currency
     * This adjust currency for a viewer. Can be given negative values. Provide it with the database record for a viewer.
     */
    async adjustCurrency(
        viewer: FirebotViewer,
        currencyId: string,
        value: number | string,
        adjustType = "adjust"
    ): Promise<void> {
        if (currencyAccess.isViewerDBOn() !== true) {
            return;
        }

        if (typeof value === "string") {
            value = parseInt(value);
        }

        // Don't do anything if value is not a number or is 0.
        if (isNaN(value)) {
            return;
        }

        adjustType = adjustType.toLowerCase();
        let newViewerValue = value;

        switch (adjustType) {
            case "set":
                logger.debug(`Currency: Setting ${viewer.username} currency ${currencyId} to: ${value}.`);
                newViewerValue = value;
                break;
            default:
                if (value === 0) {
                    return;
                }
                logger.debug(`Currency: Adjusting ${value} currency to ${viewer.username}. ${currencyId}`);
                newViewerValue = (viewer.currency[currencyId] + value);
        }

        const db = viewerDatabase.getViewerDb();
        const updateDoc = {};
        const currencyCache = currencyAccess.getCurrencies();
        const currencyLimit = isNaN(currencyCache[currencyId].limit) ? 0 : currencyCache[currencyId].limit;

        // If new value would put them over the currency limit set by the viewer...
        // Just set them at currency limit. Otherwise add currency to what they have now.

        let valueToSet = newViewerValue;
        if (newViewerValue > currencyLimit && currencyLimit !== 0) {
            valueToSet = currencyLimit;
        } else if (newViewerValue < 0) {
            valueToSet = 0;
        } else {
            valueToSet = newViewerValue;
        }

        const previousValue = viewer.currency[currencyId] ?? 0;

        updateDoc[`currency.${currencyId}`] = valueToSet;

        try {
            // Update the DB with our new currency value.
            await db.updateAsync({ _id: viewer._id }, { $set: updateDoc }, {});
            eventManager.triggerEvent("firebot", "currency-update", {
                username: viewer?.username,
                currencyId: currencyId,
                currencyName: currencyCache[currencyId]?.name,
                previousCurrencyAmount: previousValue,
                newCurrencyAmount: valueToSet
            });
            await viewerDatabase.calculateAutoRanks(viewer._id, "currency");
        } catch (error) {
            logger.error("Currency: Error setting currency on viewer.", error);
        }
    }

    // Purge Currency
    // This will set all viewers to 0 for a specific currency.
    async purgeCurrencyById(currencyId: string): Promise<void> {
        if (currencyAccess.isViewerDBOn() !== true) {
            return;
        }

        try {
            const db = viewerDatabase.getViewerDb();
            const updateDoc = {};

            updateDoc[`currency.${currencyId}`] = 0;

            await db.updateAsync({}, { $set: updateDoc }, { multi: true });
        } catch (error) {
            logger.error("Error purging currency to all viewers", error);
        }
    }

    // Delete Currency
    // This will completely delete a currency from the DB.
    async deleteCurrencyById(currencyId: string): Promise<void> {
        if (currencyAccess.isViewerDBOn() !== true) {
            return;
        }

        try {
            const db = viewerDatabase.getViewerDb();
            const viewers = await db.findAsync({});

            for (let i = 0; i < viewers.length; i++) {
                const viewer = viewers[i];
                delete viewer.currency[currencyId];
                await db.updateAsync({ _id: viewer._id }, { $set: viewer }, {});
            }
        } catch (error) {
            logger.error("Error purging currency to all viewers", error);
        }
    }

    // Start up our currency timers at the next full minute mark.
    // Then we'll check all of our currencies each minute to see if any need to be applied.
    startTimer(): void {
        const currentTime = DateTime.utc();
        const nextMinute = DateTime.utc()
            .endOf("minute")
            .plus(Duration.fromObject({ seconds: 1 }));
        const diff = nextMinute.diff(currentTime, "seconds").seconds;

        logger.debug(`Currency timer will start in ${diff} seconds`);

        setTimeout(() => {
            this.stopTimer();
            logger.debug("Starting currency timer.");
            //start timer, fire interval every minute.
            this._currencyInterval = setInterval(async () => {
                await this.applyCurrency();
            }, 60000);
        }, diff * 1000);
    }

    // This will stop our currency timers.
    stopTimer(): void {
        logger.debug("Clearing previous currency intervals");
        if (this._currencyInterval != null) {
            clearInterval(this._currencyInterval);
            this._currencyInterval = null;
        }
    }

    // This is run when the interval fires for currencies.
    async applyCurrency(): Promise<void> {
        logger.debug("Running currency timer...");

        const currencyData = currencyAccess.getCurrencies();
        const currencies = Object.values(currencyData);

        for (const currency of currencies) {
            let basePayout = currency.payout;
            if (!connectionManager.streamerIsOnline()) {
                if (!currency.offline) {
                    continue;
                }

                basePayout = currency.offline as number;
            }

            const currentMinutes = DateTime.utc().minute;
            const intervalMod = currentMinutes % currency.interval;
            const chatConnected = twitchChat.chatIsConnected;
            if (intervalMod === 0 && currency.active && chatConnected) {
                // do payout
                logger.info(`Currency: Paying out ${basePayout} ${currency.name}.`);

                await this.processCurrencyTimer(currency, basePayout);
            } else if (!chatConnected) {
                logger.debug(`Currency: Not connected to chat, so ${currency.name} will not pay out.`);
            } else if (!currency.active) {
                logger.debug(`Currency: ${currency.name} is not active, so it will not pay out.`);
            } else if (intervalMod !== 0) {
                logger.debug(`Currency: ${currency.name} is not ready to pay out yet.`);
            } else {
                logger.error(`Currency: Something weird happened and ${currency.name} couldn't pay out.`);
            }
        }
    }

    async processCurrencyTimer(currency: Currency, basePayout: number): Promise<void> {
        try {
            // Add base payout to everyone.
            await this.addCurrencyToOnlineViewers(currency.id, basePayout);
        } catch (error) {
            logger.error('Error while processing currency timer. Could not add currency to all online viewers.', error);
            return;
        }

        try {
            const bonusObject = currency.bonus;
            // Loop through our bonuses and try to apply the currency.
            for (const bonusKey of Object.keys(bonusObject)) {
                await this.addCurrencyToViewerGroupOnlineViewers([bonusKey], currency.id, bonusObject[bonusKey]);
            }
        } catch (error) {
            logger.error('Error while processing currency timer. Could not add bonus currency to a role.', error);
        }
    }

    // Adjust currency for viewer.
    // This adjust currency when given a username. Can be given negative values to remove currency.
    async adjustCurrencyForViewer(username: string, currencyId: string, value: number | string, adjustType = "adjust"): Promise<boolean> {
        if (currencyAccess.isViewerDBOn() !== true) {
            return false;
        }

        if (typeof value === "string") {
            // Try to make value an integer.
            value = parseInt(value);
        }

        // Validate inputs.
        if (username === null || currencyId === null || value == null || isNaN(value)) {
            return false;
        }

        // Trim username just in case we have extra spaces.
        username = username.trim();

        // Okay, it passes... let's try to add it.
        const viewer = await viewerDatabase.getViewerByUsername(username);

        if (viewer != null) {
            await this.adjustCurrency(viewer, currencyId, value, adjustType);
            return true;
        }

        return false;
    }

    async adjustCurrencyForViewerById(userId: string, currencyId: string, value: string | number, overrideValue = false): Promise<boolean> {
        if (currencyAccess.isViewerDBOn() !== true) {
            return null;
        }

        const viewer = await viewerDatabase.getViewerById(userId);

        if (viewer == null) {
            return null;
        }

        return await this.adjustCurrencyForViewer(viewer.username, currencyId, value, overrideValue ? 'set' : 'adjust');
    }

    // Add Currency to Viewergroup
    // This will add an amount of currency to all online viewers in a usergroup.
    async addCurrencyToViewerGroupOnlineViewers(
        roleIds: string[] = [],
        currencyId: string,
        value: string | number,
        ignoreDisable = false,
        adjustType = "adjust"
    ): Promise<void> {
        if (currencyAccess.isViewerDBOn() !== true) {
            return;
        }

        // Run our checks. Stop if we have a bad value, currency, or roles.
        if (typeof value === "string") {
            value = parseInt(value);
        }

        if (!roleIds.length || currencyId === null || value === null || (value === 0 && adjustType.toLowerCase() !== "set") || isNaN(value)) {
            return;
        }

        const onlineViewers = await viewerOnlineStatusManager.getOnlineViewers();

        const teamRoles: Record<string, Array<{ id: string; name: string; }>> = {};
        for (const viewer of onlineViewers) {
            teamRoles[viewer._id] = await teamRolesManager
                .getAllTeamRolesForViewer(viewer._id);
        }

        const userIdsInRoles = onlineViewers
            .map((u) => {
                const twitchRoles = u.twitchRoles ?? [];

                const allRoles = [
                    ...twitchRoles.map(tr => twitchRolesManager.mapTwitchRole(tr)),
                    ...customRolesManager.getAllCustomRolesForViewer(u._id),
                    ...teamRoles[u._id],
                    ...firebotRolesManager.getAllFirebotRolesForViewer(u._id)
                ];

                return {
                    ...u,
                    allRoles
                };
            })
            .filter(u => u.allRoles.some(r => roleIds.includes(r.id)))
            .map(u => u._id);

        // Log it.
        logger.debug(`Paying out ${value} currency (${currencyId}) for online viewers:`);
        logger.debug("role ids", roleIds);
        logger.debug("user ids", userIdsInRoles);


        if (!userIdsInRoles.length) {
            return;
        }

        // GIVE DEM BOBS.
        try {
            const db = viewerDatabase.getViewerDb();
            const viewers = await db.findAsync({ online: true, _id: { $in: userIdsInRoles } });

            for (const viewer of viewers) {
                if (
                    viewer != null &&
                    viewer.disableActiveUserList !== true &&
                    (ignoreDisable || viewer.disableAutoStatAccrual !== true)
                ) {
                    await this.adjustCurrency(viewer, currencyId, value, adjustType);
                }
            }
        } catch (error) {
            return;
        }
    }

    // Add Currency to all Online Viewers
    // This will add an amount of currency to all viewers who are currently seen as online.
    async addCurrencyToOnlineViewers(
        currencyId: string,
        value: string | number,
        ignoreDisable = false,
        adjustType = "adjust"
    ): Promise<void> {
        if (currencyAccess.isViewerDBOn() !== true) {
            return;
        }

        // Don't do anything for non numbers or 0 if we're not specifically setting a value.
        if (typeof value === "string") {
            value = parseInt(value);
        }

        if (isNaN(value) || (value === 0 && adjustType.toLowerCase() !== "set")) {
            return;
        }

        const db = viewerDatabase.getViewerDb();
        const viewers = await db.findAsync({ online: true });

        for (const viewer of viewers) {
            if (
                viewer != null &&
                viewer.disableActiveUserList !== true &&
                (ignoreDisable || viewer.disableAutoStatAccrual !== true)
            ) {
                await this.adjustCurrency(viewer, currencyId, value, adjustType);
            }
        }
    }

    /**
     * Adjusts currency for all viewers in the database
     */
    async adjustCurrencyForAllViewers(
        currencyId: string,
        value: string | number,
        ignoreDisable = false,
        adjustType = "adjust"
    ): Promise<void> {
        if (currencyAccess.isViewerDBOn() !== true) {
            return;
        }

        // Don't do anything for non numbers or 0 if we're not specifically setting a value.
        if (typeof value === "string") {
            value = parseInt(value);
        }

        if (isNaN(value) || (value === 0 && adjustType.toLowerCase() !== "set")) {
            return;
        }

        const db = viewerDatabase.getViewerDb();
        const viewers = await db.findAsync({});

        // Do the loop!
        for (const viewer of viewers) {
            if (
                viewer != null &&
                (ignoreDisable || viewer.disableAutoStatAccrual !== true)
            ) {
                await this.adjustCurrency(viewer, currencyId, value, adjustType);
            }
        }
    }

    // Add Currency To All Viewers
    // This will add currency to all viewers regardless of if they're online or not.
    async addCurrencyToAllViewers(currencyId: string, value: number): Promise<void> {
        if (currencyAccess.isViewerDBOn() !== true) {
            return;
        }
        const db = viewerDatabase.getViewerDb();
        const updateDoc = {};
        updateDoc[`currency.${currencyId}`] = value;
        try {
            await db.updateAsync({}, { $set: updateDoc }, { multi: true });
        } catch (error) {
            logger.error("Error adding currency to all viewers", error);
        }
    }


    // Get Viewer Currency Amount
    // This will retrieve the amount of currency that a viewer has.
    async getViewerCurrencyAmount(username: string, currencyId: string): Promise<number> {
        if (currencyAccess.isViewerDBOn() !== true) {
            return 0;
        }
        try {
            const viewer = await viewerDatabase.getViewerByUsername(username);
            if (viewer != null && !isNaN(viewer.currency[currencyId])) {
                return viewer.currency[currencyId];
            }
            return 0;
        } catch (error) {
            return null;
        }
    }

    async getViewerCurrencies(usernameOrId: string, isUsername = false): Promise<Record<string, number>> {
        if (currencyAccess.isViewerDBOn() !== true) {
            return {};
        }
        const viewer = isUsername ?
            await viewerDatabase.getViewerByUsername(usernameOrId) :
            await viewerDatabase.getViewerById(usernameOrId);

        if (viewer == null) {
            return null;
        }

        return viewer.currency;
    }

    async getViewerCurrencyRank(currencyId: string, usernameOrId: string, isUsername = false): Promise<number> {
        if (currencyAccess.isViewerDBOn() !== true) {
            return 0;
        }

        const viewer = isUsername ?
            await viewerDatabase.getViewerByUsername(usernameOrId) :
            await viewerDatabase.getViewerById(usernameOrId);

        if (viewer == null) {
            return 0;
        }

        const db = viewerDatabase.getViewerDb();

        const sortObj = {};
        sortObj[`currency.${currencyId}`] = -1;

        const projectionObj = { username: 1, displayName: 1, currency: 1 };

        try {
            const viewers = await db.findAsync({ twitch: true })
                .sort(sortObj)
                .projection(projectionObj);

            const rank = viewers.findIndex(v => v.username === viewer.username) + 1;

            return rank;
        } catch (error) {
            logger.error("Error getting viewer currency rank: ", error);
            return 0;
        }
    }

    async getTopCurrencyPosition(currencyId: string, position = 1): Promise<FirebotViewer> {
        if (currencyAccess.isViewerDBOn() !== true) {
            return;
        }

        const db = viewerDatabase.getViewerDb();

        const sortObj = {};
        sortObj[`currency.${currencyId}`] = -1;

        const projectionObj = { username: 1, displayName: 1, currency: 1 };

        try {
            const viewers = await db.findAsync({ twitch: true })
                .sort(sortObj)
                .skip(position - 1)
                .limit(1)
                .projection(projectionObj);

            return !!viewers.length ? viewers[0] : null;
        } catch (error) {
            logger.error("Error getting top currency holders: ", error);
            return;
        }
    }

    async getTopCurrencyHolders(currencyIdOrName: string, count: number, byName = false): Promise<FirebotViewer[]> {
        if (currencyAccess.isViewerDBOn() !== true) {
            return [];
        }

        let currencyId = currencyIdOrName;
        if (byName) {
            currencyId = (currencyAccess.getCurrencyByName(currencyIdOrName)).id;
        }

        const db = viewerDatabase.getViewerDb();

        const sortObj = {};
        sortObj[`currency.${currencyId}`] = -1;

        const projectionObj = { username: 1, displayName: 1, currency: 1 };

        try {
            const viewers = await db.findAsync({ twitch: true })
                .sort(sortObj)
                .limit(count)
                .projection(projectionObj);

            return viewers || [];
        } catch (error) {
            logger.error("Error getting top currency holders: ", error);
            return [];
        }
    }
}

const currencyManager = new CurrencyManager();

export = currencyManager;