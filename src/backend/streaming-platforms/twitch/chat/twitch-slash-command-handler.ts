import { TwitchSlashCommand, TwitchSlashCommandValidationResult } from './twitch-slash-commands';
import {
    timeoutHandler,
    banHandler,
    unbanHandler,
    vipHandler,
    unvipHandler,
    modHandler,
    unmodHandler
} from "./slash-commands/moderation-handlers";
import {
    whisperHandler,
    announceHandler,
    announceblueHandler,
    announcegreenHandler,
    announceorangeHandler,
    announcepurpleHandler,
    shoutoutHandler,
    clearHandler,
    emoteonlyHandler,
    emoteonlyoffHandler,
    followersHandler,
    followersoffHandler,
    subscribersHandler,
    subscribersoffHandler,
    slowHandler,
    slowoffHandler,
    uniquechatHandler,
    uniquechatoffHandler
} from "./slash-commands/chat-handlers";
import {
    commercialHandler,
    raidHandler,
    unraidHandler
} from "./slash-commands/channel-handlers";
import logger from '../../../logwrapper';

export class TwitchSlashCommandHandler {
    private static _handlers: TwitchSlashCommand[] = [
        timeoutHandler,
        banHandler,
        unbanHandler,
        vipHandler,
        unvipHandler,
        modHandler,
        unmodHandler,

        whisperHandler,
        announceHandler,
        announceblueHandler,
        announcegreenHandler,
        announceorangeHandler,
        announcepurpleHandler,
        shoutoutHandler,
        clearHandler,
        emoteonlyHandler,
        emoteonlyoffHandler,
        followersHandler,
        followersoffHandler,
        subscribersHandler,
        subscribersoffHandler,
        slowHandler,
        slowoffHandler,
        uniquechatHandler,
        uniquechatoffHandler,

        commercialHandler,
        raidHandler,
        unraidHandler
    ];

    static validateChatCommand(message: string): TwitchSlashCommandValidationResult<unknown[]> {
        const [command, ...args] = message.split(" ");

        const matchedHandler = this._handlers.find(h => h.commands.includes(command?.toLowerCase()));
        if (!matchedHandler) {
            return {
                success: false,
                foundCommand: false,
                errorMessage: "No matching command"
            };
        }

        return matchedHandler.validateArgs(args);
    }
    static async processChatCommand(message: string, sendAsBot = false): Promise<boolean> {
        const validationResult = this.validateChatCommand(message);

        if (validationResult.success === false) {
            return false;
        }

        const [command] = message.split(" ");
        logger.debug(`Found slash command handler for ${command}`);

        const matchedHandler = this._handlers.find(h => h.commands.includes(command?.toLowerCase()));
        return await matchedHandler.handle(validationResult.args, sendAsBot);
    }
}