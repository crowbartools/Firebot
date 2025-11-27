import { TwitchSlashCommand, TwitchSlashCommandValidationResult } from './twitch-slash-commands';
import type { TwitchApi } from '../api';

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

export class TwitchSlashCommandHandler {
    private _apiBase: typeof TwitchApi;

    constructor(apiBase: typeof TwitchApi) {
        this._apiBase = apiBase;
    }

    private _handlers: TwitchSlashCommand[] = [
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

    validateChatCommand(message: string): TwitchSlashCommandValidationResult<unknown[]> {
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

    async processChatCommand(message: string, sendAsBot = false): Promise<boolean> {
        const validationResult = this.validateChatCommand(message);

        if (validationResult.success === false) {
            return false;
        }

        const [command] = message.split(" ");
        this._apiBase.logger.debug(`Found slash command handler for ${command}`);

        const matchedHandler = this._handlers.find(h => h.commands.includes(command?.toLowerCase()));
        return await matchedHandler.handle(this._apiBase, sendAsBot, ...validationResult.args);
    }
}