import { TypedEmitter } from "tiny-typed-emitter";
import NodeCache from "node-cache";
import type { HelixChatChatter } from "@twurple/api";

import { SettingsManager } from "../common/settings-manager";
import { TwitchApi } from "../streaming-platforms/twitch/api";
import chatHelpers from "./chat-helpers";
import chatRolesManager from "../roles/chat-roles-manager";
import viewerDatabase from "../viewers/viewer-database";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";
import { getRandomInt } from "../utils";

type User = {
    id: string;
    username: string;
};

type UserDetails = User & {
    displayName: string;
    profilePicUrl: string;
    twitchRoles: string[];
    disableViewerList?: boolean;
};

type ChatUser = {
    userId: string;
    userName: string;
    displayName: string;
    isBroadcaster?: boolean;
    isFounder?: boolean;
    isSubscriber?: boolean;
    isMod?: boolean;
    isVip?: boolean;
    online?: boolean;
};

type Events = {
    "user:online": (userDetails: UserDetails) => void;
    "user:offline": (userId: string) => void;
};

class ActiveUserHandler extends TypedEmitter<Events> {
    private readonly DEFAULT_ACTIVE_TIMEOUT = 300; // 5 mins
    private readonly ONLINE_TIMEOUT = 450; // 7.50 mins

    private _onlineUsers = new NodeCache({
        stdTTL: this.ONLINE_TIMEOUT,
        checkperiod: 15
    });

    private _activeUsers = new NodeCache({
        stdTTL: this.DEFAULT_ACTIVE_TIMEOUT,
        checkperiod: 15
    });

    constructor() {
        super();

        this._activeUsers.on("expired", (usernameOrId: string) => {
            frontendCommunicator.send("twitch:chat:user-inactive", usernameOrId);
        });

        this._onlineUsers.on("expired", (userId: string) => {
            this.emit("user:offline", userId);
            frontendCommunicator.send("twitch:chat:user-left", userId);
        });
    }

    /**
     * Check if user is active
     * @param usernameOrId Twitch username or user ID
     * @returns `true` if the specified user is active, or `false` otherwise
     */
    userIsActive(usernameOrId: string): boolean {
        if (typeof usernameOrId === 'string') {
            usernameOrId = usernameOrId.toLowerCase();
        }

        return this._activeUsers.get(usernameOrId) != null;
    }

    getActiveUserCount(): number {
        // we divide by two because we add two entries for every user (username and id)
        return this._activeUsers.keys().length / 2;
    }

    getRandomActiveUser(ignoreUser = ""): User {
        // Ensure this isn't null
        ignoreUser = ignoreUser ?? "";

        const allActiveUsers = this.getAllActiveUsers();

        let randomUser: User;
        do {
            const randomIndex = getRandomInt(0, allActiveUsers.length - 1);
            randomUser = allActiveUsers[randomIndex];
        } while (randomUser?.username?.toLowerCase() === ignoreUser.toLowerCase() && allActiveUsers.length > 1);

        if (ignoreUser && randomUser?.username?.toLowerCase() === ignoreUser.toLowerCase()) {
            return null;
        }

        return randomUser;
    }

    getAllActiveUsers(): User[] {
        return this._activeUsers.keys().filter(v => !isNaN(Number(v))).map((id) => {
            return {
                id: id,
                username: this._activeUsers.get(id)
            };
        });
    }

    getOnlineUserCount(): number {
        return this._onlineUsers.keys().length;
    }

    getRandomOnlineUser(ignoreUser = ""): UserDetails {
        const allOnlineUsers = this.getAllOnlineUsers();
        if (allOnlineUsers.length === 0) {
            return null;
        }

        let randomUser: UserDetails;
        do {
            const randomIndex = getRandomInt(0, allOnlineUsers.length - 1);
            randomUser = allOnlineUsers[randomIndex];
        } while (randomUser.username.toLowerCase() === ignoreUser.toLowerCase() && allOnlineUsers.length > 1);

        if (ignoreUser && randomUser.username.toLowerCase() === ignoreUser.toLowerCase()) {
            return null;
        }

        return randomUser;
    }

    getAllOnlineUsers(): UserDetails[] {
        return this._onlineUsers.keys().map((id) => {
            return {
                id: id,
                ...this._onlineUsers.get(id)
            };
        });
    }

    private async updateUserOnlineStatus(userDetails: UserDetails, updateDb = false) {
        const userOnline: ChatUser = this._onlineUsers.get(userDetails.id);
        if (userOnline && userOnline.online === true) {
            logger.debug(`Updating user ${userDetails.displayName}'s "online" ttl to ${this.ONLINE_TIMEOUT} secs`);
            this._onlineUsers.ttl(userDetails.id, this.ONLINE_TIMEOUT);
        } else {
            logger.debug(`Marking user ${userDetails.displayName} as online with ttl of ${this.ONLINE_TIMEOUT} secs`);
            this._onlineUsers.set(userDetails.id, {
                username: userDetails.username,
                displayName: userDetails.displayName,
                online: true,
                twitchRoles: userDetails.twitchRoles,
                profilePicUrl: userDetails.profilePicUrl
            }, this.ONLINE_TIMEOUT);

            const roles = await chatRolesManager.getUsersChatRoles(userDetails.id);

            frontendCommunicator.send("twitch:chat:user-joined", {
                id: userDetails.id,
                username: userDetails.username,
                displayName: userDetails.displayName,
                roles: roles,
                profilePicUrl: userDetails.profilePicUrl,
                active: this.userIsActive(userDetails.id),
                disableViewerList: userDetails.disableViewerList
            });

            if (updateDb) {
                this.emit("user:online", userDetails);
            }
        }
    }

    async addOnlineUser(viewer: HelixChatChatter) {
        try {
            const firebotUser = await viewerDatabase.getViewerById(viewer.userId);

            if (firebotUser == null) {
                const twitchUser = await TwitchApi.users.getUserById(viewer.userId);

                if (twitchUser == null) {
                    logger.warn(`Could not find Twitch user with ID '${viewer.userId}'`);
                    return;
                }

                const roles = await chatRolesManager.getUsersChatRoles(twitchUser.id);

                const userDetails = {
                    id: twitchUser.id,
                    username: twitchUser.name,
                    displayName: twitchUser.displayName,
                    twitchRoles: roles,
                    profilePicUrl: twitchUser.profilePictureUrl,
                    disableViewerList: false
                };

                chatHelpers.setUserProfilePicUrl(twitchUser.id, twitchUser.profilePictureUrl);

                await viewerDatabase.addNewViewerFromChat(userDetails, true);

                await this.updateUserOnlineStatus(userDetails, false);
            } else {
                const userDetails = {
                    id: firebotUser._id,
                    username: viewer.userName,
                    displayName: viewer.userDisplayName,
                    twitchRoles: firebotUser.twitchRoles,
                    profilePicUrl: firebotUser.profilePicUrl,
                    disableViewerList: !!firebotUser.disableViewerList
                };
                await this.updateUserOnlineStatus(userDetails, true);
            }
        } catch (error) {
            logger.error(`Failed to set ${viewer.userDisplayName} as online`, error);
        }
    }

    async addActiveUser(chatUser: ChatUser, includeInOnline = false, forceActive = false) {
        if (chatUser.userName === "jtv" || chatUser.displayName === "jtv") {
            return;
        }

        const ttl = SettingsManager.getSetting("ActiveChatUserListTimeout") * 60;

        let user = await viewerDatabase.getViewerById(chatUser.userId);

        const userDetails = {
            id: chatUser.userId,
            username: chatUser.userName.toLowerCase(),
            displayName: chatUser.displayName,
            twitchRoles: [
                ...(chatUser.isBroadcaster ? ['broadcaster'] : []),
                ...(chatUser.isFounder || chatUser.isSubscriber ? ['sub'] : []),
                ...(chatUser.isMod ? ['mod'] : []),
                ...(chatUser.isVip ? ['vip'] : [])
            ],
            profilePicUrl: (await chatHelpers.getUserProfilePicUrl(chatUser.userId)),
            disableViewerList: !!user?.disableViewerList
        };

        if (user == null) {
            user = await viewerDatabase.addNewViewerFromChat(userDetails, includeInOnline);
        }

        if (includeInOnline) {
            void this.updateUserOnlineStatus(userDetails, true);
        }

        await viewerDatabase.incrementDbField(userDetails.id, "chatMessages");

        if (!forceActive && user?.disableActiveUserList) {
            return;
        }

        const userActive = this._activeUsers.get(userDetails.id);
        if (!userActive) {
            logger.debug(`Marking user ${userDetails.displayName} as active with ttl of ${ttl} secs`, ttl);
            this._activeUsers.set(userDetails.id, userDetails.username, ttl);
            this._activeUsers.set(userDetails.username, userDetails.id, ttl);
            frontendCommunicator.send("twitch:chat:user-active", userDetails.id);
        } else {
        // user is still active reset ttl
            logger.debug(`Updating user ${userDetails.displayName}'s "active" ttl to ${ttl} secs`, ttl);
            this._activeUsers.ttl(userDetails.id, ttl);
            this._activeUsers.ttl(userDetails.username, ttl);
            frontendCommunicator.send("twitch:chat:user-active", userDetails.id);
        }
    };

    removeActiveUser(usernameOrId: string | number) {
        const isUsername = typeof usernameOrId === 'string';
        if (isUsername) {
            usernameOrId = (<string>usernameOrId).toLowerCase();
        }
        const other = this._activeUsers.get(usernameOrId);
        if (other == null) {
            return;
        }
        // @ts-ignore
        this._activeUsers.del([usernameOrId, other]);
        frontendCommunicator.send("twitch:chat:user-inactive", isUsername ? other : usernameOrId);
    }

    clearAllActiveUsers() {
        this._activeUsers.flushAll();
        this._onlineUsers.flushAll();
        frontendCommunicator.send("twitch:chat:clear-user-list");
    }
}

const handler = new ActiveUserHandler();

export { handler as ActiveUserHandler };