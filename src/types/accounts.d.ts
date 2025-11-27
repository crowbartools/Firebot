import type { AuthDetails } from "./auth";

export type FirebotAccount = {
    username: string;
    displayName?: string;
    description?: string;
    userId?: string;
    channelId?: string;
    avatar?: string;
    broadcasterType?: string;
    auth?: AuthDetails;
    loggedIn?: boolean;
};