import logger from "../logwrapper";
import accountAccess from "../common/account-access";
import twitchApi from "../twitch-api/api";
import activeChatUserHandler from "../chat/chat-listeners/active-user-handler";

// Every 5 mins
const POLL_INTERVAL: number = 5 * 60 * 1000;

class TwitchChatterPoll {    
    private _chatterPollIntervalId: NodeJS.Timeout;
    private _pollIsRunning: boolean = false;
    
    private clearPollInterval(): void {
        if (this._chatterPollIntervalId != null) {
            clearTimeout(this._chatterPollIntervalId);
        }
    }
    
    private async handleChatters(): Promise<void> {
        try {
            const streamer = accountAccess.getAccounts().streamer;
            const client = twitchApi.getClient();
    
            if (client == null || !streamer.loggedIn) {
                return;
            }
    
            logger.debug("Getting connected chat users...");
    
            const chatters = await twitchApi.chat.getAllChatters();
    
            logger.debug(`There are ${chatters.length} online chat users.`);
    
            if (chatters.length < 1) {
                return;
            }
    
            for (const username of chatters) {
                await activeChatUserHandler.addOnlineUser(username);
            }
        } catch (error) {
            logger.error("There was an error getting connected chat users", error);
        }
    }
    
    async runChatterPoll(): Promise<void> {
        if (this._pollIsRunning === true) {
            return;
        }
    
        this._pollIsRunning = true;
    
        await this.handleChatters();
    
        this._pollIsRunning = false;
    };
    
    startChatterPoll(): void {
        this.clearPollInterval();
        this.runChatterPoll();
        this._chatterPollIntervalId = setInterval(this.runChatterPoll, POLL_INTERVAL);
    };
    
    stopChatterPoll(): void {
        this.clearPollInterval();
    };
}

export = new TwitchChatterPoll();