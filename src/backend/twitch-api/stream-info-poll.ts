import logger from "../logwrapper";
import accountAccess from "../common/account-access";
import frontendCommunicator from "../common/frontend-communicator";
import TwitchApi from "./api";

interface TwitchStreamInfo {
    isLive: boolean;
    viewers: number;
    startedAt?: Date;
}

// every 15 secs
const POLL_INTERVAL = 15 * 1000;

class TwitchStreamInfoPoll {
    private _streamInfoPollIntervalId: NodeJS.Timeout;
    
    streamInfo: TwitchStreamInfo = {
        isLive: false,
        viewers: 0,
        startedAt: null
    };

    private clearPollInterval(): void {
        if (this._streamInfoPollIntervalId != null) {
            clearTimeout(this._streamInfoPollIntervalId);
        }
    }

    private async handleStreamInfo(): Promise<void> {
        const streamer = accountAccess.getAccounts().streamer;
        const client = TwitchApi.streamerClient;

        if (client == null || !streamer.loggedIn) {
            return;
        }

        const stream = await client.asUser(streamer.userId, async ctx => {
            return await ctx.streams.getStreamByUserId(streamer.userId);
        });

        let streamInfoChanged = false;
        if (stream == null) {
            if (this.streamInfo.isLive) {
                streamInfoChanged = true;
            }
            this.streamInfo.isLive = false;
        } else {
            if (!this.streamInfo.isLive ||
                this.streamInfo.viewers !== stream.viewers ||
                this.streamInfo.startedAt !== stream.startDate) {
                streamInfoChanged = true;
            }
            this.streamInfo.isLive = true;
            this.streamInfo.viewers = stream.viewers;
            this.streamInfo.startedAt = stream.startDate;
        }
        if (streamInfoChanged) {
            logger.debug(`Sending stream info update`);
            frontendCommunicator.send("stream-info-update", this.streamInfo);
        }
    }

    startStreamInfoPoll(): void {
        this.clearPollInterval();
        this.handleStreamInfo();
        this._streamInfoPollIntervalId = setInterval(() => this.handleStreamInfo(), POLL_INTERVAL);
    }
    
    stopStreamInfoPoll(): void {
        this.clearPollInterval();
    }
}

const twitchStreamInfoPoll = new TwitchStreamInfoPoll();

frontendCommunicator.onAsync("get-stream-info", async () => {
    return twitchStreamInfoPoll.streamInfo;
});

export = twitchStreamInfoPoll;