import { PlatformApi, PlatformUser } from "firebot-types";

const TWITCH_PLATFORM_ID = "twitch";

const testUser: PlatformUser = {
    platformId: TWITCH_PLATFORM_ID,
    id: "12345",
    displayName: "ebiggz",
    username: "ebiggz",
    channelId: "12345",
    roles: [
        {
            id: "broadcaster",
            name: "Broadcaster",
            platformId: TWITCH_PLATFORM_ID,
        },
    ],
};

const twitchApi: PlatformApi = {
    getChannel: () =>
        Promise.resolve({
            platformId: TWITCH_PLATFORM_ID,
            id: "12345",
            category: {
                id: "1234",
                name: "test game",
            },
            title: "test",
            userId: "12345",
        }),
    getUser: () => Promise.resolve(testUser),
    getUserByName: () => Promise.resolve(testUser),
    getChatUsers: () => Promise.resolve([testUser]),
    updateChannelInfo: () => Promise.resolve(),
};

export default twitchApi;
