import { TwitchApi } from "../../streaming-platforms/twitch/api";
import { TwitchSlashCommandHandler } from "../twitch-slash-commands";
import { TwitchCommandHelpers } from "./twitch-command-helpers";

export const commercialHandler: TwitchSlashCommandHandler<[number]> = {
    commands: ["/commercial"],
    validateArgs: ([duration]) => {
        const parsedDuration = TwitchCommandHelpers.getRawDurationInSeconds(duration);

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

export const raidHandler: TwitchSlashCommandHandler<[string]> = {
    commands: ["/raid"],
    validateArgs: ([targetUsername]) => {
        if (targetUsername == null || targetUsername.length < 1) {
            return {
                success: false,
                errorMessage: "Please provide a username"
            };
        }

        targetUsername = TwitchCommandHelpers.getNormalizedUsername(targetUsername);

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

export const unraidHandler: TwitchSlashCommandHandler<[]> = {
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