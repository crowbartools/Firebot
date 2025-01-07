import twitchApi from "../../twitch-api/api";
import { TwitchSlashCommandHandler } from "../twitch-slash-command-handler";
import { TwitchCommandHelpers } from "./twitch-command-helpers";
import frontendCommunicator from "../../common/frontend-communicator";

export const whisperHandler: TwitchSlashCommandHandler<[string, string]> = {
    commands: ["/whisper", "/w"],
    validateArgs: ([targetUsername, ...message]) => {
        if (targetUsername == null || targetUsername.length < 1) {
            return {
                success: false,
                errorMessage: "Please provide a username"
            };
        }

        targetUsername = TwitchCommandHelpers.getNormalizedUsername(targetUsername);

        if (message == null || message.length < 1) {
            return {
                success: false,
                errorMessage: "Please provide a whisper message"
            };
        }

        return {
            success: true,
            args: [targetUsername, message.join(" ")]
        };
    },
    handle: async ([targetUsername, message], sendAsBot = false) => {
        const targetUserId = (await twitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        return await twitchApi.whispers.sendWhisper(targetUserId, message, sendAsBot);
    }
};

export const announceHandler: TwitchSlashCommandHandler<[string]> = {
    commands: ["/announce"],
    validateArgs: (message) => {
        if (message == null || message.length < 1) {
            return {
                success: false,
                errorMessage: "Please provide a message"
            };
        }

        return {
            success: true,
            args: [message.join(" ")]
        };
    },
    handle: async ([message], sendAsBot = false) => {
        return await twitchApi.chat.sendAnnouncement(message, "primary", sendAsBot);
    }
};

export const announceblueHandler: TwitchSlashCommandHandler<[string]> = {
    commands: ["/announceblue"],
    validateArgs: (message) => {
        if (message == null || message.length < 1) {
            return {
                success: false,
                errorMessage: "Please provide a message"
            };
        }

        return {
            success: true,
            args: [message.join(" ")]
        };
    },
    handle: async ([message], sendAsBot = false) => {
        return await twitchApi.chat.sendAnnouncement(message, "blue", sendAsBot);
    }
};

export const announcegreenHandler: TwitchSlashCommandHandler<[string]> = {
    commands: ["/announcegreen"],
    validateArgs: (message) => {
        if (message == null || message.length < 1) {
            return {
                success: false,
                errorMessage: "Please provide a message"
            };
        }

        return {
            success: true,
            args: [message.join(" ")]
        };
    },
    handle: async ([message], sendAsBot = false) => {
        return await twitchApi.chat.sendAnnouncement(message, "green", sendAsBot);
    }
};

export const announceorangeHandler: TwitchSlashCommandHandler<[string]> = {
    commands: ["/announceorange"],
    validateArgs: (message) => {
        if (message == null || message.length < 1) {
            return {
                success: false,
                errorMessage: "Please provide a message"
            };
        }

        return {
            success: true,
            args: [message.join(" ")]
        };
    },
    handle: async ([message], sendAsBot = false) => {
        return await twitchApi.chat.sendAnnouncement(message, "orange", sendAsBot);
    }
};

export const announcepurpleHandler: TwitchSlashCommandHandler<[string]> = {
    commands: ["/announcepurple"],
    validateArgs: (message) => {
        if (message == null || message.length < 1) {
            return {
                success: false,
                errorMessage: "Please provide a message"
            };
        }

        return {
            success: true,
            args: [message.join(" ")]
        };
    },
    handle: async ([message], sendAsBot = false) => {
        return await twitchApi.chat.sendAnnouncement(message, "purple", sendAsBot);
    }
};

export const shoutoutHandler: TwitchSlashCommandHandler<[string]> = {
    commands: ["/shoutout"],
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
    handle: async ([targetUsername]) => {
        const targetUserId = (await twitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }
        const result = await twitchApi.chat.sendShoutout(targetUserId);
        if (!result.success) {
            frontendCommunicator.send("chatUpdate", {
                fbEvent: "ChatAlert",
                message: result.error
            });
        }
        return result.success;
    }
};

export const clearHandler: TwitchSlashCommandHandler<[]> = {
    commands: ["/clear"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await twitchApi.chat.clearChat();
    }
};

export const emoteonlyHandler: TwitchSlashCommandHandler<[]> = {
    commands: ["/emoteonly"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await twitchApi.chat.setEmoteOnlyMode(true);
    }
};

export const emoteonlyoffHandler: TwitchSlashCommandHandler<[]> = {
    commands: ["/emoteonlyoff"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await twitchApi.chat.setEmoteOnlyMode(false);
    }
};

export const followersHandler: TwitchSlashCommandHandler<[number]> = {
    commands: ["/followers"],
    validateArgs: ([duration]) => {
        const parsedDuration = TwitchCommandHelpers.getRawDurationInSeconds(duration, "minutes");

        if (parsedDuration == null) {
            return {
                success: false,
                errorMessage: "Please provide a valid duration"
            };
        }

        return {
            success: true,
            args: [Math.floor(parsedDuration / 60)]
        };
    },
    handle: async ([duration]) => {
        return await twitchApi.chat.setFollowerOnlyMode(true, duration ?? 0);
    }
};

export const followersoffHandler: TwitchSlashCommandHandler<[]> = {
    commands: ["/followersoff"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await twitchApi.chat.setFollowerOnlyMode(false);
    }
};

export const subscribersHandler: TwitchSlashCommandHandler<[]> = {
    commands: ["/subscribers"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await twitchApi.chat.setSubscriberOnlyMode(true);
    }
};

export const subscribersoffHandler: TwitchSlashCommandHandler<[]> = {
    commands: ["/subscribersoff"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await twitchApi.chat.setSubscriberOnlyMode(false);
    }
};

export const slowHandler: TwitchSlashCommandHandler<[number]> = {
    commands: ["/slow"],
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
        return await twitchApi.chat.setSlowMode(true, duration ?? 5);
    }
};

export const slowoffHandler: TwitchSlashCommandHandler<[]> = {
    commands: ["/slowoff"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await twitchApi.chat.setSlowMode(false);
    }
};

export const uniquechatHandler: TwitchSlashCommandHandler<[]> = {
    commands: ["/uniquechat"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await twitchApi.chat.setUniqueMode(true);
    }
};

export const uniquechatoffHandler: TwitchSlashCommandHandler<[]> = {
    commands: ["/uniquechatoff"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await twitchApi.chat.setUniqueMode(false);
    }
};