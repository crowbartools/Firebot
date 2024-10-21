export type FirebotParsedMessagePart = {
    type: string;
    id?: string;
    text?: string;
    name?: string;
    origin?: string;
    position?: number;
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
    badges: unknown[];
    customRewardId?: string;
    color?: string;
    rawText: string;
    parts: FirebotParsedMessagePart[];
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
    autoModStatus?: string;
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