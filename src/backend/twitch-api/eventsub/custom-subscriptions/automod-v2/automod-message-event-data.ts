export interface EventSubAutoModMessageAutoModBoundaryData {
    start_pos: number;
    end_pos: number;
}

export interface EventSubAutoModMessageFoundBlockedTermData {
    term_id: string;
    owner_broadcaster_user_id: string;
    owner_broadcaster_user_login: string;
    owner_broadcaster_user_name: string;
    boundary: EventSubAutoModMessageAutoModBoundaryData;
}

export interface EventSubAutoModMessageBlockedTermData {
    terms_found: EventSubAutoModMessageFoundBlockedTermData[];
}

export type EventSubAutoModMessageHoldReason = 'automod' | 'blocked_term';

export interface EventSubChatMessageTextPart {
    type: 'text';
    text: string;
}

export interface EventSubChatMessageCheermote {
    prefix: string;
    bits: number;
    tier: number;
}

export interface EventSubChatMessageCheermotePart {
    type: 'cheermote';
    text: string;
    cheermote: EventSubChatMessageCheermote;
}

export interface EventSubChatMessageEmote {
    id: string;
    emote_set_id: string;
    owner_id: string;
    format: string[];
}

export interface EventSubChatMessageEmotePart {
    type: 'emote';
    text: string;
    emote: EventSubChatMessageEmote;
}

export type EventSubAutoModMessagePart =
	| EventSubChatMessageTextPart
	| EventSubChatMessageCheermotePart
	| EventSubChatMessageEmotePart;

export interface EventSubAutoModMessageData {
    text: string;
    fragments: EventSubAutoModMessagePart[];
}

export type EventSubAutoModLevel = 0 | 1 | 2 | 3 | 4;

export interface EventSubAutoModMessageAutoModData {
    category: string;
    level: EventSubAutoModLevel;
    boundaries: EventSubAutoModMessageAutoModBoundaryData[];
}

export interface EventSubAutoModMessageHoldV2EventData {
    broadcaster_user_id: string;
    broadcaster_user_login: string;
    broadcaster_user_name: string;
    user_id: string;
    user_login: string;
    user_name: string;
    message_id: string;
    message: EventSubAutoModMessageData;
    reason: EventSubAutoModMessageHoldReason;
    automod: EventSubAutoModMessageAutoModData | null;
    blocked_term: EventSubAutoModMessageBlockedTermData | null;
    held_at: string;
}

export type EventSubAutoModResolutionStatus = 'approved' | 'denied' | 'expired';

export interface EventSubAutoModMessageUpdateV2EventData extends EventSubAutoModMessageHoldV2EventData {
    moderator_user_id: string;
    moderator_user_login: string;
    moderator_user_name: string;
    status: EventSubAutoModResolutionStatus;
}


