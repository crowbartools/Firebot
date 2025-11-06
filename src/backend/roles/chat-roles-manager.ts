import { TypedEmitter } from "tiny-typed-emitter";

import type { BasicViewer } from "../../types/viewers";
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

interface Subscriber {
    id?: string;
    username: string;
    displayName?: string;
    subTier: string;
}

interface KnownBotServiceResponse {
    bots: Array<[string, number, number]>;
}

type Events = {
    "viewer-role-updated": (userId: string, roleId: string, action: "added" | "removed") => void;
};

class ChatRolesManager extends TypedEmitter<Events> {
    private _knownBots: KnownBot[] = [];
    private _vips: BasicViewer[] = [];
    private _moderators: BasicViewer[] = [];
    private _subscribers: Subscriber[] = [];

    constructor() {
        super();
    }

    setupListeners(): void {
        TwitchApi.moderation.on("vip:added", user => this.addVipToVipList(user));
        TwitchApi.moderation.on("vip:removed", userId => this.removeVipFromVipList(userId));
        TwitchApi.moderation.on("moderator:added", user => this.addModeratorToModeratorsList(user));
        TwitchApi.moderation.on("moderator:removed", userId => this.removeModeratorFromModeratorsList(userId));

        frontendCommunicator.on("get-moderators", () => this._moderators);
        frontendCommunicator.on("get-vips", () => this._vips);
        frontendCommunicator.on("get-subscribers", () => this._subscribers);
        frontendCommunicator.on("get-known-bots", () => this._knownBots);
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

    async loadVips(): Promise<void> {
        this._vips = (await TwitchApi.channels.getVips()).map(u => ({
            id: u.id,
            username: u.name,
            displayName: u.displayName
        }));
    }

    getVips(): BasicViewer[] {
        return this._vips;
    }

    addVipToVipList(viewer: BasicViewer): void {
        if (!this._vips.some(v => v.id === viewer.id)) {
            this._vips.push(viewer);
            this.emit("viewer-role-updated", viewer.id, "vip", "added");
        }
    }

    removeVipFromVipList(userId: string): void {
        this._vips = this._vips.filter(v => v.id !== userId);
        this.emit("viewer-role-updated", userId, "vip", "removed");
    }

    async loadModerators(): Promise<void> {
        this._moderators = (await TwitchApi.moderation.getModerators())
            .map(m => ({
                id: m.userId,
                username: m.userName,
                displayName: m.userDisplayName
            }));
    }

    getModerators(): BasicViewer[] {
        return this._moderators;
    }

    addModeratorToModeratorsList(viewer: BasicViewer): void {
        if (!this._moderators.some(v => v.id === viewer.id)) {
            this._moderators.push(viewer);
            this.emit("viewer-role-updated", viewer.id, "mod", "added");
        }
    }

    removeModeratorFromModeratorsList(userId: string): void {
        this._moderators = this._moderators.filter(v => v.id !== userId);
        this.emit("viewer-role-updated", userId, "mod", "removed");
    }

    async loadSubscribers(): Promise<void> {
        const streamer = AccountAccess.getAccounts().streamer;
        if (!streamer || !streamer.loggedIn || streamer.broadcasterType === "") {
            return;
        }

        this._subscribers = (await TwitchApi.subscriptions.getSubscriptions())
            .map(m => ({
                id: m.userId,
                username: m.userName,
                displayName: m.userDisplayName,
                subTier: this.getRoleForSubTier(m.tier)
            }));
    }

    private getRoleForSubTier(tier: string): string {
        let role = "";
        switch (tier) {
            case "1000":
                role = "tier1";
                break;
            case "2000":
                role = "tier2";
                break;
            case "3000":
                role = "tier3";
                break;
        }

        return role;
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

            if (this._subscribers.some(m => m.id === userId)) {
                roles.push("sub");
                roles.push(this._subscribers.find(m => m.id === userId).subTier);
            }

            if (this._vips.some(v => v.id === userId)) {
                roles.push("vip");
            }

            if (this._moderators.some(m => m.id === userId)) {
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