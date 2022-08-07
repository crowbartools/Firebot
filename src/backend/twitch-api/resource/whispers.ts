import { ApiClient, HelixUser, UserIdResolvable } from "@twurple/api";
const twitchApi = require("../api");
const accountAccess = require("../../common/account-access");
const logger = require('../../logwrapper');

export async function sendWhisper(recipientUserId: UserIdResolvable, message: string, sendAsBot: boolean = false): Promise<boolean> {
    const client: ApiClient = sendAsBot === true ? twitchApi.getBotClient() : twitchApi.getClient();
    const senderUserId: number = sendAsBot === true ? accountAccess.getAccounts().bot.userId : accountAccess.getAccounts().streamer.userId;

    try {
        await client.whispers.sendWhisper(senderUserId, recipientUserId, message);
        
        return true;
    } catch (error) {
        logger.error("Error sending whisper", error);
    }
    
    return false;
}