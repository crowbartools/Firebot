import { AccountAccess } from "../../common/account-access";
import { ActiveUserHandler } from "../../chat/active-user-handler";
import { TwitchApi } from "./api";
import logger from "../../logwrapper";

// Every 5 mins
const POLL_INTERVAL: number = 5 * 60 * 1000;

class TwitchChatterPoll {
    private _chatterPollIntervalId: NodeJS.Timeout;
    private _pollIsRunning = false;

    private clearPollInterval(): void {
        if (this._chatterPollIntervalId != null) {
            clearTimeout(this._chatterPollIntervalId);
        }
    }

    private async handleChatters(): Promise<void> {
        try {
            const streamer = AccountAccess.getAccounts().streamer;

            if (TwitchApi.streamerClient == null || !streamer.loggedIn) {
                return;
            }

            logger.debug("Getting connected chat users...");

            const chatters = await TwitchApi.chat.getAllChatters();

            logger.debug(`There are ${chatters.length} online chat users.`);

            if (!chatters.length) {
                return;
            }

            for (const chatter of chatters) {
                await ActiveUserHandler.addOnlineUser(chatter);
            }
        } catch (error) {
            logger.error("There was an error getting connected chat users", (error as Error).message);
        }
    }

    async runChatterPoll(): Promise<void> {
        if (this._pollIsRunning === true) {
            return;
        }

        this._pollIsRunning = true;

        await this.handleChatters();

        this._pollIsRunning = false;
    }

    startChatterPoll(): void {
        this.clearPollInterval();
        void this.runChatterPoll();
        this._chatterPollIntervalId = setInterval(() => this.runChatterPoll(), POLL_INTERVAL);
    }

    stopChatterPoll(): void {
        this.clearPollInterval();
    }
}

export = new TwitchChatterPoll();