import { TwitchApi } from "../../api";
import { TwitchSlashCommand } from "../twitch-slash-commands";
import { TwitchSlashCommandHelpers } from "./twitch-command-helpers";
import frontendCommunicator from "../../../../common/frontend-communicator";

export const whisperHandler: TwitchSlashCommand<[string, string]> = {
    commands: ["/whisper", "/w"],
    validateArgs: ([targetUsername, ...message]) => {
        if (targetUsername == null || targetUsername.length < 1) {
            return {
                success: false,
                errorMessage: "Please provide a username"
            };
        }

        targetUsername = TwitchSlashCommandHelpers.getNormalizedUsername(targetUsername);

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
        const targetUserId = (await TwitchApi.users.getUserByName(targetUsername))?.id;

        if (targetUserId == null) {
            return false;
        }

        return await TwitchApi.whispers.sendWhisper(targetUserId, message, sendAsBot);
    }
};

export const announceHandler: TwitchSlashCommand<[string]> = {
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
        return await TwitchApi.chat.sendAnnouncement(message, "primary", sendAsBot);
    }
};

export const announceblueHandler: TwitchSlashCommand<[string]> = {
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
        return await TwitchApi.chat.sendAnnouncement(message, "blue", sendAsBot);
    }
};

export const announcegreenHandler: TwitchSlashCommand<[string]> = {
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
        return await TwitchApi.chat.sendAnnouncement(message, "green", sendAsBot);
    }
};

export const announceorangeHandler: TwitchSlashCommand<[string]> = {
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
        return await TwitchApi.chat.sendAnnouncement(message, "orange", sendAsBot);
    }
};

export const announcepurpleHandler: TwitchSlashCommand<[string]> = {
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
        return await TwitchApi.chat.sendAnnouncement(message, "purple", sendAsBot);
    }
};

export const shoutoutHandler: TwitchSlashCommand<[string]> = {
    commands: ["/shoutout"],
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
        const result = await TwitchApi.chat.sendShoutout(targetUserId);
        if (!result.success) {
            frontendCommunicator.send("chatUpdate", {
                fbEvent: "ChatAlert",
                message: result.error
            });
        }
        return result.success;
    }
};

export const clearHandler: TwitchSlashCommand<[]> = {
    commands: ["/clear"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await TwitchApi.chat.clearChat();
    }
};

export const emoteonlyHandler: TwitchSlashCommand<[]> = {
    commands: ["/emoteonly"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await TwitchApi.chat.setEmoteOnlyMode(true);
    }
};

export const emoteonlyoffHandler: TwitchSlashCommand<[]> = {
    commands: ["/emoteonlyoff"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await TwitchApi.chat.setEmoteOnlyMode(false);
    }
};

export const followersHandler: TwitchSlashCommand<[number]> = {
    commands: ["/followers"],
    validateArgs: ([duration]) => {
        const parsedDuration = TwitchSlashCommandHelpers.getRawDurationInSeconds(duration, "minutes");

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
        return await TwitchApi.chat.setFollowerOnlyMode(true, duration ?? 0);
    }
};

export const followersoffHandler: TwitchSlashCommand<[]> = {
    commands: ["/followersoff"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await TwitchApi.chat.setFollowerOnlyMode(false);
    }
};

export const subscribersHandler: TwitchSlashCommand<[]> = {
    commands: ["/subscribers"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await TwitchApi.chat.setSubscriberOnlyMode(true);
    }
};

export const subscribersoffHandler: TwitchSlashCommand<[]> = {
    commands: ["/subscribersoff"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await TwitchApi.chat.setSubscriberOnlyMode(false);
    }
};

export const slowHandler: TwitchSlashCommand<[number]> = {
    commands: ["/slow"],
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
        return await TwitchApi.chat.setSlowMode(true, duration ?? 5);
    }
};

export const slowoffHandler: TwitchSlashCommand<[]> = {
    commands: ["/slowoff"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await TwitchApi.chat.setSlowMode(false);
    }
};

export const uniquechatHandler: TwitchSlashCommand<[]> = {
    commands: ["/uniquechat"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await TwitchApi.chat.setUniqueMode(true);
    }
};

export const uniquechatoffHandler: TwitchSlashCommand<[]> = {
    commands: ["/uniquechatoff"],
    validateArgs: () => {
        return {
            success: true,
            args: []
        };
    },
    handle: async () => {
        return await TwitchApi.chat.setUniqueMode(false);
    }
};