import { TypedEmitter } from "tiny-typed-emitter";
import twitchRolesManager from "./twitch-roles-manager";
import frontendCommunicator from "../common/frontend-communicator";
import { AccountAccess } from "../common/account-access";
import { TwitchApi } from "../streaming-platforms/twitch/api";
import logger from "../logwrapper";

const VIEWLIST_BOTS_URL = "https://api.twitchinsights.net/v1/bots/all";

interface KnownBot {
    id?: string;
    username: string;
    channels: number;
}

interface KnownBotServiceResponse {
    bots: Array<[string, number, number]>;
}

class ChatRolesManager {
    private _knownBots: KnownBot[] = [];

    setupListeners(): void {
        frontendCommunicator.on("chat-roles:get-known-bots", () => this._knownBots);
    }

    async cacheViewerListBots(): Promise<void> {
        if (this._knownBots?.length) {
            return;
        }

        try {
            const responseData = await (await fetch(VIEWLIST_BOTS_URL, {
                signal: AbortSignal.timeout(30_000)
            })).json() as KnownBotServiceResponse;
            if (responseData?.bots != null) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                this._knownBots = responseData.bots.map(([username, channels, _lastSeen]) => {
                    return {
                        username: username.toLowerCase(),
                        channels: channels
                    };
                }) ?? [];
            }
        } catch {
            // silently fail
        }
    }

    async userIsKnownBot(userId: string): Promise<boolean> {
        if (!userId?.length) {
            return false;
        }

        if (this._knownBots?.length) {
            if (this._knownBots.some(b => b.id === userId) === true) {
                return true;
            }

            const user = await TwitchApi.users.getUserById(userId);
            if (user != null) {
                const username = user.name.toLowerCase();
                const bot = this._knownBots.find(b => b.username === username);

                if (bot != null) {
                    bot.id = user.id;
                    return true;
                }
            }
        }

        return false;
    }

    async getUsersChatRoles(userId: string): Promise<string[]> {
        if (!userId?.length) {
            return [];
        }

        const roles: string[] = [];

        try {
            if (await this.userIsKnownBot(userId) === true) {
                roles.push("viewerlistbot");
            }

            const streamer = AccountAccess.getAccounts().streamer;
            if (userId === streamer.userId) {
                roles.push("broadcaster");
            }

            const subscribers = twitchRolesManager.getSubscribers();
            if (subscribers.some(m => m.id === userId)) {
                roles.push("sub");
                roles.push(subscribers.find(m => m.id === userId).subTier);
            }

            const vips = twitchRolesManager.getVips();
            if (vips.some(v => v.id === userId)) {
                roles.push("vip");
            }

            const moderators = twitchRolesManager.getModerators();
            if (moderators.some(m => m.id === userId)) {
                roles.push("mod");
            }

            return roles;
        } catch (err) {
            logger.error("Failed to get user chat roles", err);
            return [];
        }
    }
}

const chatRolesManager = new ChatRolesManager();

export = chatRolesManager;