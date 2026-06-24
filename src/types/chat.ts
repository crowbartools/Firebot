type FirebotChatMessagePartType =
    | "text"
    | "link"
    | "emote"
    | "third-party-emote"
    | "cheermote"
    | "mention";

type FirebotChatMessagePartBase = {
    type: FirebotChatMessagePartType;
    id?: string;
    text: string;
};

export type FirebotChatMessageTextPart = FirebotChatMessagePartBase & {
    type: "text";
    flagged?: boolean;
};

export type FirebotChatMessageLinkPart = FirebotChatMessagePartBase & {
    type: "link";
    url: string;
};

export type FirebotChatMessageEmotePart = FirebotChatMessagePartBase & {
    type: "emote" | "third-party-emote";
    name: string;
    origin: string;
    url: string;
    animatedUrl?: string;
};

export type FirebotChatMessageCheermotePart = FirebotChatMessagePartBase & {
    type: "cheermote";
    name: string;
    url: string;
    animatedUrl: string;
    amount: number;
    color: string;
};

export type FirebotChatMessageMentionPart = FirebotChatMessagePartBase & {
    type: "mention";
    username: string;
    userId: string;
    userDisplayName: string;
};

export type FirebotChatMessagePart =
    | FirebotChatMessageTextPart
    | FirebotChatMessageLinkPart
    | FirebotChatMessageEmotePart
    | FirebotChatMessageCheermotePart
    | FirebotChatMessageMentionPart;

export type FirebotParsedMessagePart = {
    type: string;
    id?: string;
    text?: string;
    name?: string;
    origin?: string;
    position?: number;
    flagged?: boolean;
    length?: number;
    url?: string;
    animatedUrl?: string;
    amount?: number;
    color?: string;
};

export type FirebotChatMessage = {
    id: string;
    timestamp?: number;
    timestampDisplay?: string;
    username: string;
    userId: string;
    userDisplayName?: string;
    profilePicUrl?: string;
    pronouns?: string;
    isExtension?: boolean;
    roles: string[];
    badges: Array<{
        title: string;
        url: string;
    }>;
    customRewardId?: string;
    color?: string;
    rawText: string;
    parts: FirebotParsedMessagePart[] | FirebotChatMessagePart[];
    whisper: boolean;
    whisperTarget?: string;
    action: boolean;
    isAnnouncement?: boolean;
    announcementColor?: "PRIMARY" | "BLUE" | "GREEN" | "ORANGE" | "PURPLE";
    tagged: boolean;
    isFounder?: boolean;
    isBroadcaster?: boolean;
    isBot?: boolean;
    isMod?: boolean;
    isSubscriber?: boolean;
    isVip?: boolean;
    isCheer?: boolean;
    isHighlighted?: boolean;
    isAutoModHeld?: boolean;
    autoModStatus?: "pending" | "approved" | "denied" | "expired";
    autoModReason?: string;
    autoModHeldMessageId?: string;
    autoModResolvedBy?: string;
    autoModErrorMessage?: string;
    isFirstChat?: boolean;
    isReturningChatter?: boolean;
    isRaider?: boolean;
    raidingFrom?: string;
    isSuspiciousUser?: boolean;
    isReply?: boolean;
    replyParentMessageId?: string;
    replyParentMessageText?: string;
    replyParentMessageSenderUserId?: string;
    replyParentMessageSenderDisplayName?: string;
    threadParentMessageId?: string;
    threadParentMessageSenderUserId?: string;
    threadParentMessageSenderDisplayName?: string;
    isSharedChatMessage: boolean;
    sharedChatRoomId?: string;
    sharedChatRoomUsername?: string;
    sharedChatRoomDisplayName?: string;
    sharedChatRoomProfilePicUrl?: string;
    isHiddenFromChatFeed?: boolean;
    viewerRanks?: Record<string, string>;
    viewerCustomRoles?: string[];
    customHighlightColor?: string;
    customBannerIcon?: string;
    customBannerText?: string;
    reward?: {
        id: string;
        name: string;
        cost: number;
        imageUrl: string;
    };
    powerUp?: {
        id: string;
        name: string;
        bits: number;
        imageUrl: string;
    };
    isGigantified?: boolean;
};

export type FirebotEmote = {
    url: string;
    animatedUrl: string;
    origin: string;
    code: string;
};

export type FirebotCheermoteInstance = {
    name: string;
    amount: number;
    url: string;
    animatedUrl: string;
    color: string;
};

export type SharedChatParticipant = {
    broadcasterId: string;
    broadcasterName: string;
    broadcasterDisplayName: string;
    profilePictureUrl: string;
};

type DashboardChatFeedItemType =
    | "message"
    | "alert"
    | "reward-redemption"
    | "power-up-redemption";

type DashboardChatFeedItemBase = {
    id: string;
    type: DashboardChatFeedItemType;
};

export type DashboardChatMessageData = FirebotChatMessage & {
    deleted?: boolean;
    isHiddenFromChatFeed?: boolean;
    customHighlightColor?: string;
    customBannerIcon?: string;
    customBannerText?: string;
};

export type DashboardChatFeedMessageItem = DashboardChatFeedItemBase & {
    type: "message";
    data: DashboardChatMessageData;
    rewardMatched?: boolean;
    powerUpMatched?: boolean;
};

export type DashboardChatFeedAlertItem = DashboardChatFeedItemBase & {
    type: "alert";
    message: string;
    icon: string;
};

export type DashboardChatFeedRewardData = {
    id: string;
    status: string;
    messageText: string;
    user: {
        id: string;
        username: string;
        displayName: string;
    };
    reward: {
        id: string;
        name: string;
        cost: number;
        imageUrl: string;
    };
};

export type DashboardChatFeedRewardItem = DashboardChatFeedItemBase & {
    type: "reward-redemption";
    data: DashboardChatFeedRewardData;
    rewardMatched?: boolean;
};

export type DashboardChatFeedPowerUpData = {
    id: string;
    status: string;
    messageText: string;
    user: {
        id: string;
        username: string;
        displayName: string;
    };
    powerUp: {
        id: string;
        name: string;
        bits: number;
        imageUrl: string;
    };
};

export type DashboardChatFeedPowerUpItem = DashboardChatFeedItemBase & {
    type: "power-up-redemption";
    data: DashboardChatFeedPowerUpData;
    powerUpMatched?: boolean;
};

export type DashboardChatFeedItem =
    | DashboardChatFeedMessageItem
    | DashboardChatFeedAlertItem
    | DashboardChatFeedRewardItem
    | DashboardChatFeedPowerUpItem;