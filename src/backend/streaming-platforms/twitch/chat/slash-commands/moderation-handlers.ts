import { TwitchApi } from "../../api";
import { TwitchSlashCommand } from "../twitch-slash-commands";
import { TwitchSlashCommandHelpers } from "./twitch-command-helpers";
import chatRolesManager from "../../../../roles/chat-roles-manager";

export const timeoutHandler: TwitchSlashCommand<[string, number, string]> = {
    commands: ["/timeout"],
    validateArgs: ([targetUsername, duration, ...reason]) => {
        if (targetUsername == null || targetUsername.length < 1) {
            return {
                success: false,
                errorMessage: "Please provide a username"
            };
        }

        const parsedDuration = TwitchSlashCommandHelpers.getRawDurationInSeconds(duration);
        if (parsedDuration == null) {
            return {
                success: false,
                errorMessage: "Please provide a valid duration"
            };
        }

        targetUsername = TwitchSlashCommandHelpers.getNormalizedUsername(targetUsername);
        const formattedReason: string = reason == null ? null : reason.join(" ");

        return {
            success: true,
            args: [targetUsername, parsedDuration, formattedReason]
        };
    },
    handle: async ([targetUsername, duration, reason]) => {
        const targetUserId = (await TwitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        return await TwitchApi.moderation.timeoutUser(targetUserId, duration, reason);
    }
};

export const banHandler: TwitchSlashCommand<[string, string]> = {
    commands: ["/ban"],
    validateArgs: ([targetUsername, ...reason]) => {
        if (targetUsername == null || targetUsername.length < 1) {
            return {
                success: false,
                errorMessage: "Please provide a username"
            };
        }

        targetUsername = TwitchSlashCommandHelpers.getNormalizedUsername(targetUsername);
        const formattedReason: string = reason == null ? null : reason.join(" ");

        return {
            success: true,
            args: [targetUsername, formattedReason]
        };
    },
    handle: async ([targetUsername, reason]) => {
        const targetUserId = (await TwitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        return await TwitchApi.moderation.banUser(targetUserId, reason);
    }
};

export const unbanHandler: TwitchSlashCommand<[string]> = {
    commands: ["/unban", "/untimeout"],
    validateArgs: ([targetUsername]) => {
        if (targetUsername == null || targetUsername.length < 1) {
            return {
                success: false,
                errorMessage: "Please provide a username"
            };
        }

        targetUsername = TwitchSlashCommandHelpers.getNormalizedUsername(targetUsername);

        return {
            success: true,
            args: [targetUsername]
        };
    },
    handle: async ([targetUsername]) => {
        const targetUserId = (await TwitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        return await TwitchApi.moderation.unbanUser(targetUserId);
    }
};

export const vipHandler: TwitchSlashCommand<[string]> = {
    commands: ["/vip"],
    validateArgs: ([targetUsername]) => {
        if (targetUsername == null || targetUsername.length < 1) {
            return {
                success: false,
                errorMessage: "Please provide a username"
            };
        }

        targetUsername = TwitchSlashCommandHelpers.getNormalizedUsername(targetUsername);

        return {
            success: true,
            args: [targetUsername]
        };
    },
    handle: async ([targetUsername]) => {
        const targetUser = await TwitchApi.users.getUserByName(targetUsername);

        if (targetUser == null) {
            return false;
        }

        const result = await TwitchApi.moderation.addChannelVip(targetUser.id);
        if (result === true) {
            chatRolesManager.addVipToVipList({
                id: targetUser.id,
                username: targetUser.name,
                displayName: targetUser.displayName
            });
        }
        return result;
    }
};

export const unvipHandler: TwitchSlashCommand<[string]> = {
    commands: ["/unvip"],
    validateArgs: ([targetUsername]) => {
        if (targetUsername == null || targetUsername.length < 1) {
            return {
                success: false,
                errorMessage: "Please provide a username"
            };
        }

        targetUsername = TwitchSlashCommandHelpers.getNormalizedUsername(targetUsername);

        return {
            success: true,
            args: [targetUsername]
        };
    },
    handle: async ([targetUsername]) => {
        const targetUserId = (await TwitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        const result = await TwitchApi.moderation.removeChannelVip(targetUserId);
        if (result === true) {
            chatRolesManager.removeVipFromVipList(targetUserId);
        }
        return result;
    }
};

export const modHandler: TwitchSlashCommand<[string]> = {
    commands: ["/mod"],
    validateArgs: ([targetUsername]) => {
        if (targetUsername == null || targetUsername.length < 1) {
            return {
                success: false,
                errorMessage: "Please provide a username"
            };
        }

        targetUsername = TwitchSlashCommandHelpers.getNormalizedUsername(targetUsername);

        return {
            success: true,
            args: [targetUsername]
        };
    },
    handle: async ([targetUsername]) => {
        const targetUserId = (await TwitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        return await TwitchApi.moderation.addChannelModerator(targetUserId);
    }
};

export const unmodHandler: TwitchSlashCommand<[string]> = {
    commands: ["/unmod"],
    validateArgs: ([targetUsername]) => {
        if (targetUsername == null || targetUsername.length < 1) {
            return {
                success: false,
                errorMessage: "Please provide a username"
            };
        }

        targetUsername = TwitchSlashCommandHelpers.getNormalizedUsername(targetUsername);

        return {
            success: true,
            args: [targetUsername]
        };
    },
    handle: async ([targetUsername]) => {
        const targetUserId = (await TwitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        return await TwitchApi.moderation.removeChannelModerator(targetUserId);
    }
};