import { TwitchSlashCommand } from "../twitch-slash-commands";
import { TwitchSlashCommandHelpers } from "./twitch-command-helpers";

export const commercialHandler: TwitchSlashCommand<[number]> = {
    commands: ["/commercial"],
    validateArgs: ([duration]) => {
        const parsedDuration = TwitchSlashCommandHelpers.getRawDurationInSeconds(duration);

        if (parsedDuration == null) {
            return {
                success: false,
                errorMessage: "Please provide a valid duration"
            };
        }

        return {
            success: true,
            args: [parsedDuration]
        };
    },
    handle: async (twitchApi, _, duration) => {
        return await twitchApi.channels.triggerAdBreak(duration);
    }
};

export const raidHandler: TwitchSlashCommand<[string]> = {
    commands: ["/raid"],
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
    handle: async(twitchApi, _, targetUsername) => {
        const targetUserId = (await twitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        return await twitchApi.channels.raidChannel(targetUserId);
    }
};

export const unraidHandler: TwitchSlashCommand<[]> = {
    commands: ["/unraid"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async(twitchApi) => {
        return await twitchApi.channels.cancelRaid();
    }
};