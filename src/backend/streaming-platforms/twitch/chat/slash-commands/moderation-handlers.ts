import { TwitchSlashCommand } from "../twitch-slash-commands";
import { TwitchSlashCommandHelpers } from "./twitch-command-helpers";

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
    handle: async (twitchApi, _, targetUsername, duration, reason) => {
        const targetUserId = (await twitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        return await twitchApi.moderation.timeoutUser(targetUserId, duration, reason);
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
    handle: async (twitchApi, _, targetUsername, reason) => {
        const targetUserId = (await twitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        return await twitchApi.moderation.banUser(targetUserId, reason);
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
    handle: async (twitchApi, _, targetUsername) => {
        const targetUserId = (await twitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        return await twitchApi.moderation.unbanUser(targetUserId);
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
    handle: async (twitchApi, _, targetUsername) => {
        const targetUser = await twitchApi.users.getUserByName(targetUsername);

        if (targetUser == null) {
            return false;
        }

        return await twitchApi.moderation.addChannelVip(targetUser.id);
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
    handle: async (twitchApi, _, targetUsername) => {
        const targetUserId = (await twitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        return await twitchApi.moderation.removeChannelVip(targetUserId);
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
    handle: async (twitchApi, _, targetUsername) => {
        const targetUserId = (await twitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        return await twitchApi.moderation.addChannelModerator(targetUserId);
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
    handle: async (twitchApi, _, targetUsername) => {
        const targetUserId = (await twitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        return await twitchApi.moderation.removeChannelModerator(targetUserId);
    }
};