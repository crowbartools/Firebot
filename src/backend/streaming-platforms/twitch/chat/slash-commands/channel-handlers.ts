import { TwitchApi } from "../../api";
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
    handle: async ([duration]) => {
        return await TwitchApi.channels.triggerAdBreak(duration);
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
    handle: async([targetUsername]) => {
        const targetUserId = (await TwitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        return await TwitchApi.channels.raidChannel(targetUserId);
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
    handle: async() => {
        return await TwitchApi.channels.cancelRaid();
    }
};