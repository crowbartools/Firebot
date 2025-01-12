import { DateTime } from "luxon";
import logger from "../logwrapper";
import accountAccess from "../common/account-access";
import { SettingsManager } from "../common/settings-manager";
import frontendCommunicator from "../common/frontend-communicator";
import TwitchApi from "./api";
import {
    triggerCategoryChanged,
    triggerTitleChanged
} from "../events/twitch-events/stream";
import adManager from "./ad-manager";

interface TwitchStreamInfo {
    isLive?: boolean;
    viewers?: number;
    startedAt?: Date;
    title?: string;
    categoryId?: string;
    categoryName?: string;
    language?: string;
}

// every 15 secs
const POLL_INTERVAL = 15 * 1000;

// Every 25 minutes
const WEB_CHECKIN_INTERVAL = 25;

class TwitchStreamInfoManager {
    private _streamInfoPollIntervalId: NodeJS.Timeout;
    private _lastWebCheckin: DateTime = DateTime.fromMillis(0);

    streamInfo: TwitchStreamInfo = {
        isLive: false,
        viewers: 0,
        startedAt: null
    };

    private clearPollInterval(): void {
        if (this._streamInfoPollIntervalId != null) {
            clearTimeout(this._streamInfoPollIntervalId);
        }

        adManager.stopAdCheck();
    }

    private async doWebCheckin(): Promise<void> {
        try {
            if (Math.abs(this._lastWebCheckin.diffNow("minutes").minutes) >= WEB_CHECKIN_INTERVAL) {
                logger.debug("Sending online heartbeat to firebot.app");

                await fetch(`https://firebot.app/api/live-now/${accountAccess.getAccounts().streamer.userId}`, {
                    method: "POST"
                });

                this._lastWebCheckin = DateTime.utc();
            }
        } catch (error) {
            logger.warn(`Unable to do online web check-in: ${error.message}`);
        }
    }

    private async handleStreamInfo(triggerEventsOnMetaChanges = true): Promise<void> {
        const streamer = accountAccess.getAccounts().streamer;
        const client = TwitchApi.streamerClient;

        if (client == null || !streamer.loggedIn) {
            return;
        }

        const stream = await client.streams.getStreamByUserId(streamer.userId);
        const channelInfo = await client.channels.getChannelInfoById(streamer.userId);

        let streamInfoChanged = false;
        if (stream == null) {
            if (this.streamInfo.isLive) {
                streamInfoChanged = true;

                adManager.stopAdCheck();
            }
            this.streamInfo.isLive = false;
        } else {
            if (!this.streamInfo.isLive ||
                this.streamInfo.viewers !== stream.viewers ||
                this.streamInfo.startedAt !== stream.startDate) {
                streamInfoChanged = true;

                // We just went live, so start the ad check
                if (!this.streamInfo.isLive) {
                    await adManager.startAdCheck();
                }
            }
            this.streamInfo.isLive = true;
            this.streamInfo.viewers = stream.viewers;
            this.streamInfo.startedAt = stream.startDate;

            if (SettingsManager.getSetting("WebOnlineCheckin") === true) {
                await this.doWebCheckin();
            }

            const metaUpdateResult = this.updateStreamInfo({
                categoryId: channelInfo.gameId,
                categoryName: channelInfo.gameName,
                title: channelInfo.title
            }, triggerEventsOnMetaChanges);

            streamInfoChanged = streamInfoChanged || metaUpdateResult;
        }
        if (streamInfoChanged) {
            logger.debug(`Sending stream info update`);
            frontendCommunicator.send("stream-info-update", this.streamInfo);
        }
    }

    startStreamInfoPoll(): void {
        this.clearPollInterval();
        // Don't trigger events on first run
        this.handleStreamInfo(false);
        this._streamInfoPollIntervalId = setInterval(() => this.handleStreamInfo(), POLL_INTERVAL);
    }

    stopStreamInfoPoll(): void {
        this.clearPollInterval();
    }

    updateStreamInfo(streamInfo: TwitchStreamInfo, triggerEventsOnMetaChanges = true): boolean {
        let streamInfoChanged = false;

        if (this.streamInfo.categoryId !== streamInfo.categoryId
            || this.streamInfo.categoryName.toLowerCase() !== streamInfo.categoryName.toLowerCase()) {
            streamInfoChanged = true;

            this.streamInfo.categoryId = streamInfo.categoryId;
            this.streamInfo.categoryName = streamInfo.categoryName;

            if (triggerEventsOnMetaChanges === true) {
                triggerCategoryChanged(this.streamInfo.categoryName, this.streamInfo.categoryId);
            }
        }

        if (this.streamInfo.title !== streamInfo.title) {
            streamInfoChanged = true;

            this.streamInfo.title = streamInfo.title;

            if (triggerEventsOnMetaChanges === true) {
                triggerTitleChanged(this.streamInfo.title);
            }
        }

        return streamInfoChanged;
    }
}

const twitchStreamInfoManager = new TwitchStreamInfoManager();

frontendCommunicator.onAsync("get-stream-info", async () => {
    return twitchStreamInfoManager.streamInfo;
});

export = twitchStreamInfoManager;