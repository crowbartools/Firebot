export interface FirebotViewer {
    _id: string;
    username: string;
    displayName: string;
    profilePicUrl: string;
    twitch: boolean;
    twitchRoles: string[];
    online: boolean;
    onlineAt: number;
    lastSeen: number;
    joinDate: number;
    minutesInChannel: number;
    chatMessages: number;
    disableAutoStatAccrual: boolean;
    disableActiveUserList: boolean;
    disableViewerList: boolean;
    metadata: Record<string, unknown>;
    currency: Record<string, number>;
}

export interface BasicViewer {
    id: string;
    username: string;
    displayName?: string;
    twitchRoles?: string[];
    profilePicUrl?: string;
}