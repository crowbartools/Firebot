import twitchApi from "../../twitch-api/api";
import { TwitchSlashCommandHandler } from "../twitch-slash-command-handler";
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
        return await twitchApi.channels.triggerAdBreak(duration);
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
        const targetUserId = (await twitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        return await twitchApi.channels.raidChannel(targetUserId);
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
        return await twitchApi.channels.cancelRaid();
    }
};