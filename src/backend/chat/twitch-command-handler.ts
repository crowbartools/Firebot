import { ApiClient } from "@twurple/api";
const twitchApi = require("../twitch-api/api");

export type TwitchCommandHandler<Args extends unknown[] = string[]> = {
    command: string;
    validateArgs(rawArgs: string[]): {
      success: true;
      args: Args;
    } | {
      success: false;
      errorMessage: string;
    };
    handle(args: Args, sendAsBot: boolean): boolean | PromiseLike<boolean>
}

const vipHandler: TwitchCommandHandler<[string]>= {
    command: "/vip",
    validateArgs: ([targetUsername]) => {
      if (targetUsername == null || targetUsername?.length < 1) {
        return {
          success: false,
          errorMessage: "Please provide a username"
        };
      }
      return {
        success: true,
        args: [targetUsername]
      };
    },
    handle: async ([targetUsername], sendAsBot) => {
        const targetUserId = (await streamerApiClient.users.getUserByName(targetUsername))?.id;
        if(targetUserId == null) {
          return false;
        }
        await streamerApiClient.moderation.removeChannelVip(targetUserId);
        return true;
    }
}

const handlers: TwitchCommandHandler[] = [
    vipHandler
]

export async function processChatCommand(message: string, sendAsBot: boolean = false): Promise<boolean> {
    const [command, ...args] = message.split(' ');
    const streamerApiClient: ApiClient = twitchApi.getClient();

    switch (command.toLowerCase()) {
        case "/w":
        case "/whisper":
            {
                const targetUsername: string = args[0];
                const message: string = args.slice(1).join(' ');

                const targetUserId: string = (await streamerApiClient.users.getUserByName(targetUsername)).id;
    
                return await twitchApi.whispers.sendWhisper(targetUserId, message, sendAsBot);
            }

        case "/announce":
            {
                const message: string = args.join(' ');

                return await twitchApi.announcements.sendAnnouncement(message, "primary", sendAsBot);
            }

        case "/announceblue":
            {
                const message: string = args.join(' ');

                return await twitchApi.announcements.sendAnnouncement(message, "blue", sendAsBot);
            }

        case "/announcegreen":
            {
                const message: string = args.join(' ');

                return await twitchApi.announcements.sendAnnouncement(message, "green", sendAsBot);
            }

        case "/announceorange":
            {
                const message: string = args.join(' ');

                return await twitchApi.announcements.sendAnnouncement(message, "orange", sendAsBot);
            }

        case "/announcepurple":
            {
                const message: string = args.join(' ');

                return await twitchApi.announcements.sendAnnouncement(message, "purple", sendAsBot);
            }

        case "/clear":
            {
                return await twitchApi.chat.clearChat();
            }

        case "/emoteonly":
            {
                return await twitchApi.chat.setEmoteOnlyMode(true);
            }

        case "/ban":
            {
                const targetUsername: string = args[0];
                const reason: string = args.slice(1).join(' ');

                const targetUserId: string = (await streamerApiClient.users.getUserByName(targetUsername)).id;
    
                return await twitchApi.moderation.banUser(targetUserId, reason);
            }

        case "/timeout":
            {
                const targetUsername: string = args[0];
                const duration: number = parseInt(args[1]);
                const reason: string = args.slice(2).join(' ');

                const targetUserId: string = (await streamerApiClient.users.getUserByName(targetUsername)).id;
    
                return await twitchApi.moderation.timeoutUser(targetUserId, duration, reason);
            }

        case "/unban":
        case "/untimeout":
            {
                const targetUsername: string = args[0];

                const targetUserId: string = (await streamerApiClient.users.getUserByName(targetUsername)).id;
    
                return await twitchApi.moderation.unbanUser(targetUserId);
            }


        case "/vip":
            {
                const targetUsername: string = args[0];

                const targetUserId: string = (await streamerApiClient.users.getUserByName(targetUsername)).id;
    
                return await twitchApi.moderation.addChannelVip(targetUserId);
            }

        case "/unvip":
            {
                const targetUsername: string = args[0];

                const targetUserId: string = (await streamerApiClient.users.getUserByName(targetUsername)).id;
    
                return await twitchApi.moderation.removeChannelVip(targetUserId);
            }

        case "/mod":
            {
                const targetUsername: string = args[0];

                const targetUserId: string = (await streamerApiClient.users.getUserByName(targetUsername)).id;
    
                return await twitchApi.moderation.addChannelModerator(targetUserId);
            }

        case "/unmod":
            {
                const targetUsername: string = args[0];

                const targetUserId: string = (await streamerApiClient.users.getUserByName(targetUsername)).id;
    
                return await twitchApi.moderation.removeChannelModerator(targetUserId);
            }

        case "/commercial":
            {
                const duration: number = parseInt(args[0]);

                return await twitchApi.channels.triggerAdBreak(duration);
            }
    }

    return false;
}