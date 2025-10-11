import { ApiClient, UserIdResolvable } from "@twurple/api";
import logger from '../../../../logwrapper';
import accountAccess from "../../../../common/account-access";

export class TwitchWhispersApi {
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
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
        sendAsBot = false
    ): Promise<boolean> {
        const willSendAsBot: boolean = sendAsBot === true
            && accountAccess.getAccounts().bot?.userId != null
            && this._botClient != null;
        const senderUserId: string = willSendAsBot === true ?
            accountAccess.getAccounts().bot.userId :
            accountAccess.getAccounts().streamer.userId;

        try {
            const messageFragments = message
                .match(/[\s\S]{1,500}/g)
                .map(mf => mf.trim())
                .filter(mf => mf !== "");

            for (const fragment of messageFragments) {
                if (willSendAsBot === true) {
                    await this._botClient.whispers.sendWhisper(senderUserId, recipientUserId, fragment);
                } else {
                    await this._streamerClient.whispers.sendWhisper(senderUserId, recipientUserId, fragment);
                }
            }

            return true;
        } catch (error) {
            logger.error("Error sending whisper", (error as Error).message);
        }

        return false;
    }
}