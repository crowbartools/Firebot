import logger from '../logwrapper';

import {
    timeoutHandler,
    banHandler,
    unbanHandler,
    vipHandler,
    unvipHandler,
    modHandler,
    unmodHandler
} from "./twitch-commands/moderation-handlers";
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
} from "./twitch-commands/chat-handlers";
import { commercialHandler, raidHandler, unraidHandler } from "./twitch-commands/channel-handlers";

export type TwitchSlashCommandValidationResult<Args extends unknown[] = unknown[]> = {
    success: true;
    args: Args;
} | {
    success: false;
    foundCommand?: boolean;
    errorMessage: string;
};

export type TwitchSlashCommandHandler<Args extends unknown[] = unknown[]> = {
    commands: string[];
    validateArgs(rawArgs: string[]): TwitchSlashCommandValidationResult<Args>;
    handle(args: Args, sendAsBot?: boolean): boolean | PromiseLike<boolean>
};

const handlers: TwitchSlashCommandHandler[] = [
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

export function validateChatCommand(message: string): TwitchSlashCommandValidationResult<unknown[]> {
    const [command, ...args] = message.split(" ");

    const matchedHandler = handlers.find(h => h.commands.includes(command?.toLowerCase()));
    if (!matchedHandler) {
        return {
            success: false,
            foundCommand: false,
            errorMessage: "No matching command"
        };
    }

    return matchedHandler.validateArgs(args);
}

export async function processChatCommand(message: string, sendAsBot = false): Promise<boolean> {
    const validationResult = await validateChatCommand(message);

    if (validationResult.success === false) {
        return false;
    }

    const [command] = message.split(" ");
    logger.debug(`Found slash command handler for ${command}`);

    const matchedHandler = handlers.find(h => h.commands.includes(command?.toLowerCase()));
    return await matchedHandler.handle(validationResult.args, sendAsBot);
}