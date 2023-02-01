import logger from '../../logwrapper';
import twitchApi from "../api";
import accountAccess from "../../common/account-access";
import { ApiClient, UserIdResolvable } from "@twurple/api";

/**
 * Sends a whisper to another user.
 * 
 * @param recipientUserId The Twitch user ID of the recipient user
 * @param message The message to send
 * @param sendAsBot If the whisper should be sent as the bot or not.
 * If this is set to `false`, the whisper will be sent as the streamer.
 * @returns `true` if the request was successful or `false` if the request failed.
 * NOTE: Twitch may return a success even for whispers that are not sent for being suspected of spam.
 */
export async function sendWhisper(
    recipientUserId: UserIdResolvable,
    message: string,
    sendAsBot: boolean = false
): Promise<boolean> {
    const client: ApiClient = sendAsBot === true ? twitchApi.getBotClient() : twitchApi.getClient();
    const senderUserId: number = sendAsBot === true ?
        accountAccess.getAccounts().bot.userId :
        accountAccess.getAccounts().streamer.userId;

    try {
        await client.whispers.sendWhisper(senderUserId, recipientUserId, message);
        
        return true;
    } catch (error) {
        logger.error("Error sending whisper", error);
    }
    
    return false;
};