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

type FirebotChatMessageTextPart = FirebotChatMessagePartBase & {
    type: "text";
    flagged?: boolean;
};

type FirebotChatMessageLinkPart = FirebotChatMessagePartBase & {
    type: "link";
    url: string;
};

type FirebotChatMessageEmotePart = FirebotChatMessagePartBase & {
    type: "emote" | "third-party-emote";
    name: string;
    origin: string;
    url: string;
    animatedUrl?: string;
};

type FirebotChatMessageCheermotePart = FirebotChatMessagePartBase & {
    type: "cheermote";
    name: string;
    url: string;
    animatedUrl: string;
    amount: number;
    color: string;
};

type FirebotChatMessageMentionPart = FirebotChatMessagePartBase & {
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
    username: string;
    userId: string;
    userDisplayName?: string;
    profilePicUrl?: string;
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
};