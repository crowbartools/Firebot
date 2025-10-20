import { AuthDetails } from "./auth";

export type FirebotAccount = {
    username: string;
    displayName: string;
    description: string;
    userId: string;
    channelId: number;
    avatar: string;
    broadcasterType: string;
    auth: AuthDetails;
    loggedIn?: boolean;
};