import { TypedEmitter } from "tiny-typed-emitter";

import type { BasicViewer } from "../../types/viewers";
import frontendCommunicator from "../common/frontend-communicator";
import { TwitchApi } from "../streaming-platforms/twitch/api";

interface Subscriber {
    id: string;
    username: string;
    displayName?: string;
    subTier: string;
}

type Events = {
    "viewer-role-updated": (userId: string, roleId: string, action: "added" | "removed") => void;
};

class TwitchRolesManager extends TypedEmitter<Events> {
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

        frontendCommunicator.on("twitch-roles:get-moderators", () => this._moderators);
        frontendCommunicator.on("twitch-roles:get-vips", () => this._vips);
        frontendCommunicator.on("twitch-roles:get-subscribers", () => this._subscribers);
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
        this._subscribers = (await TwitchApi.subscriptions.getSubscriptions())
            .map(m => ({
                id: m.userId,
                username: m.userName,
                displayName: m.userDisplayName,
                subTier: this.getRoleForSubTier(m.tier)
            }));
    }

    getSubscribers(): Subscriber[] {
        return this._subscribers;
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
}

const twitchRolesManager = new TwitchRolesManager();

export = twitchRolesManager;