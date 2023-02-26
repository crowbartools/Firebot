import logger from '../../logwrapper';
import accountAccess from "../../common/account-access";
import { ApiClient, UserIdResolvable } from "@twurple/api";

export class TwitchWhispersApi {
    streamerClient: ApiClient;
    botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this.streamerClient = streamerClient;
        this.botClient = botClient;
    }

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
     async sendWhisper(
        recipientUserId: UserIdResolvable,
        message: string,
        sendAsBot: boolean = false
    ): Promise<boolean> {
        const willSendAsBot: boolean = sendAsBot === true
            && accountAccess.getAccounts().bot?.userId != null
            && this.botClient != null;
        const senderUserId: string = willSendAsBot === true ?
            accountAccess.getAccounts().bot.userId :
            accountAccess.getAccounts().streamer.userId;
    
        try {
            if (willSendAsBot === true) {
                await this.botClient.whispers.sendWhisper(senderUserId, recipientUserId, message);
            } else {
                await this.streamerClient.whispers.sendWhisper(senderUserId, recipientUserId, message);
            }
            
            return true;
        } catch (error) {
            logger.error("Error sending whisper", error);
        }
        
        return false;
    }
};