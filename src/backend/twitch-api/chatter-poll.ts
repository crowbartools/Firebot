import logger from "../logwrapper";
import accountAccess from "../common/account-access";
import twitchApi from "../twitch-api/api";
import activeChatUserHandler from "../chat/chat-listeners/active-user-handler";

// Every 5 mins
const POLL_INTERVAL: number = 5 * 60 * 1000;

let chatterPollIntervalId: NodeJS.Timeout;
let pollIsRunning: boolean = false;

function clearPollInterval() {
    if (chatterPollIntervalId != null) {
        clearTimeout(chatterPollIntervalId);
    }
}

async function handleChatters() {
    if (pollIsRunning === true) {
        return;
    }

    pollIsRunning = true;

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

    pollIsRunning = false;
}

export function startChatterPoll(): void {
    clearPollInterval();
    handleChatters();
    chatterPollIntervalId = setInterval(handleChatters, POLL_INTERVAL);
};

export function stopChatterPoll(): void {
    clearPollInterval();
};

export async function runChatterPoll(): Promise<void> {
    await handleChatters();
};