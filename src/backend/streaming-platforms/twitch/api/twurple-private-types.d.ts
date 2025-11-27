// These are private in Twurple, but we need them, so we redeclare them here.

import type { HelixUserType } from "@twurple/api";

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

export interface EventSubChatMessageMention {
    user_id: string;
    user_name: string;
    user_login: string;
}

export interface EventSubChatMessageMentionPart {
    type: 'mention';
    text: string;
    mention: EventSubChatMessageMention;
}

export type EventSubChatMessagePart = EventSubChatMessageTextPart | EventSubChatMessageCheermotePart | EventSubChatMessageEmotePart | EventSubChatMessageMentionPart;

export interface EventSubChatMessageData {
    text: string;
    fragments: EventSubChatMessagePart[];
}

export type HelixBroadcasterType = 'partner' | 'affiliate' | '';

export interface HelixUserData {
    id: string;
    login: string;
    display_name: string;
    description: string;
    type: HelixUserType;
    broadcaster_type: HelixBroadcasterType;
    profile_image_url: string;
    offline_image_url: string;
    view_count: number;
    created_at: string;
}